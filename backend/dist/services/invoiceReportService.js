"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceReportService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Invoice_1 = require("../models/Invoice");
const Payment_1 = require("../models/Payment");
const paymentService_1 = require("./paymentService");
const invoicePaymentStatus_1 = require("../utils/invoicePaymentStatus");
function buildInvoiceMatch(filters) {
    const match = {
        isDeleted: false,
        legacyWaterOrder: { $ne: true },
        status: { $ne: Invoice_1.InvoiceStatus.REJECTED },
    };
    if (filters.customerId) {
        match.customerId = new mongoose_1.default.Types.ObjectId(filters.customerId);
    }
    if (filters.startDate || filters.endDate) {
        const createdAt = {};
        if (filters.startDate)
            createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate)
            createdAt.$lte = new Date(filters.endDate);
        match.createdAt = createdAt;
    }
    return match;
}
function matchesPaymentMethodFilter(invoiceMethod, payments, filter) {
    if (!filter)
        return true;
    if (invoiceMethod === filter)
        return true;
    return payments.some((p) => p.paymentMethod === filter);
}
class InvoiceReportService {
    static async fetchEnrichedRows(filters) {
        const invoices = await Invoice_1.Invoice.find(buildInvoiceMatch(filters))
            .populate('customerId', 'fullName phone address')
            .sort({ createdAt: -1 })
            .lean();
        if (!invoices.length)
            return [];
        const invoiceIds = invoices.map((inv) => inv._id);
        const totalsMap = await paymentService_1.PaymentService.getTotalsByInvoiceIds(invoiceIds);
        const paymentDocs = await Payment_1.Payment.find({
            invoiceId: { $in: invoiceIds },
            isDeleted: false,
        }).lean();
        const paymentsByInvoice = new Map();
        for (const p of paymentDocs) {
            const key = String(p.invoiceId);
            if (!paymentsByInvoice.has(key))
                paymentsByInvoice.set(key, []);
            paymentsByInvoice.get(key).push({ paymentMethod: p.paymentMethod });
        }
        const now = new Date();
        const rows = [];
        for (const invoice of invoices) {
            const id = String(invoice._id);
            const totals = totalsMap.get(id) ?? { total: 0, count: 0 };
            const paymentStatus = (0, invoicePaymentStatus_1.computePaymentStatus)(invoice.total, totals.total);
            const invoicePayments = paymentsByInvoice.get(id) ?? [];
            if (!filters.status?.includes(paymentStatus))
                continue;
            if (!matchesPaymentMethodFilter(invoice.paymentMethod, invoicePayments, filters.paymentMethod)) {
                continue;
            }
            const { daysPastDue, bucket } = (0, invoicePaymentStatus_1.computeAgingBucket)(invoice.createdAt, now);
            const customer = invoice.customerId;
            rows.push({
                invoice: {
                    _id: invoice._id,
                    invoiceNo: invoice.invoiceNo,
                    total: invoice.total,
                    subtotal: invoice.subtotal,
                    tax: invoice.tax,
                    paymentMethod: invoice.paymentMethod,
                    status: invoice.status,
                    createdAt: invoice.createdAt,
                    notes: invoice.notes,
                },
                customer: customer && typeof customer === 'object'
                    ? { _id: customer._id, fullName: customer.fullName, phone: customer.phone }
                    : null,
                paymentStatus,
                totalPaid: totals.total,
                outstandingBalance: (0, invoicePaymentStatus_1.computeOutstandingBalance)(invoice.total, totals.total),
                paymentCount: totals.count,
                daysPastDue,
                agingBucket: bucket,
            });
        }
        return rows;
    }
    static buildCustomerBalances(rows) {
        const map = new Map();
        for (const row of rows) {
            const customerId = row.customer?._id ? String(row.customer._id) : 'unknown';
            const customerName = row.customer?.fullName ?? 'Unknown';
            const existing = map.get(customerId) ?? {
                customerId,
                customerName,
                totalOutstanding: 0,
                invoiceCount: 0,
            };
            existing.totalOutstanding += row.outstandingBalance;
            existing.invoiceCount += 1;
            map.set(customerId, existing);
        }
        return [...map.values()].sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    }
    static async getInvoiceSummaryReport(filters) {
        const rows = await this.fetchEnrichedRows(filters);
        const totals = {
            totalInvoices: rows.length,
            totalInvoiceAmount: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            byStatus: {
                paid: 0,
                unpaid: 0,
                partial: 0,
                credit: 0,
            },
        };
        for (const row of rows) {
            totals.totalInvoiceAmount += row.invoice.total;
            totals.totalPaid += row.totalPaid;
            totals.totalOutstanding += row.outstandingBalance;
            totals.byStatus[row.paymentStatus] += 1;
        }
        return {
            summary: rows.map((row) => ({
                invoice: row.invoice,
                customer: row.customer,
                paymentStatus: row.paymentStatus,
                totalPaid: row.totalPaid,
                outstandingBalance: row.outstandingBalance,
                paymentCount: row.paymentCount,
            })),
            totals,
            customerBalances: this.buildCustomerBalances(rows.filter((r) => r.outstandingBalance > 0)),
        };
    }
    static async getOutstandingReport(filters) {
        const rows = await this.fetchEnrichedRows(filters).then((all) => all.filter((r) => r.outstandingBalance > 0));
        const bucketTotals = {
            '0-30': { count: 0, total: 0 },
            '31-60': { count: 0, total: 0 },
            '61-90': { count: 0, total: 0 },
            '90+': { count: 0, total: 0 },
        };
        let totalOutstanding = 0;
        for (const row of rows) {
            totalOutstanding += row.outstandingBalance;
            bucketTotals[row.agingBucket].count += 1;
            bucketTotals[row.agingBucket].total += row.outstandingBalance;
        }
        return {
            outstanding: rows.map((row) => ({
                invoice: row.invoice,
                customer: row.customer,
                totalAmount: row.invoice.total,
                paidAmount: row.totalPaid,
                outstandingAmount: row.outstandingBalance,
                paymentStatus: row.paymentStatus,
                daysPastDue: row.daysPastDue,
                agingBucket: row.agingBucket,
            })),
            summary: {
                totalOutstanding,
                count: rows.length,
                bucketTotals,
            },
            customerBalances: this.buildCustomerBalances(rows),
        };
    }
}
exports.InvoiceReportService = InvoiceReportService;
//# sourceMappingURL=invoiceReportService.js.map