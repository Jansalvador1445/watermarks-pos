"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Payment_1 = require("../models/Payment");
const Invoice_1 = require("../models/Invoice");
const Customer_1 = require("../models/Customer");
const response_1 = require("../utils/response");
const invoicePaymentStatus_1 = require("../utils/invoicePaymentStatus");
class PaymentService {
    static async getTotalsByInvoiceIds(invoiceIds) {
        if (!invoiceIds.length)
            return new Map();
        const rows = await Payment_1.Payment.aggregate([
            { $match: { isDeleted: false, invoiceId: { $in: invoiceIds } } },
            { $group: { _id: '$invoiceId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);
        const map = new Map();
        for (const row of rows) {
            map.set(String(row._id), { total: row.total, count: row.count });
        }
        return map;
    }
    static async listByInvoice(invoiceId) {
        const invoice = await Invoice_1.Invoice.findOne({ _id: invoiceId, isDeleted: false }).lean();
        if (!invoice)
            throw new response_1.AppError('Invoice not found', 404);
        if (invoice.status === Invoice_1.InvoiceStatus.REJECTED) {
            throw new response_1.AppError('Cannot view payments for rejected invoices', 400);
        }
        const payments = await Payment_1.Payment.find({ invoiceId, isDeleted: false })
            .populate('recordedBy', 'name email')
            .sort({ paymentDate: -1 })
            .lean();
        const totals = await this.getTotalsByInvoiceIds([new mongoose_1.default.Types.ObjectId(invoiceId)]);
        const paymentTotals = totals.get(invoiceId) ?? { total: 0, count: 0 };
        const paymentStatus = (0, invoicePaymentStatus_1.computePaymentStatus)(invoice.total, paymentTotals.total);
        return {
            invoice: {
                _id: invoice._id,
                invoiceNo: invoice.invoiceNo,
                total: invoice.total,
                status: invoice.status,
            },
            payments,
            summary: {
                totalPaid: paymentTotals.total,
                paymentCount: paymentTotals.count,
                outstandingBalance: Math.max(0, invoice.total - paymentTotals.total),
                paymentStatus,
            },
        };
    }
    static async create(data, userId) {
        const invoice = await Invoice_1.Invoice.findOne({ _id: data.invoiceId, isDeleted: false });
        if (!invoice)
            throw new response_1.AppError('Invoice not found', 404);
        if (invoice.status === Invoice_1.InvoiceStatus.REJECTED) {
            throw new response_1.AppError('Cannot record payment on rejected invoice', 400);
        }
        const payment = await Payment_1.Payment.create({
            invoiceId: data.invoiceId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
            notes: data.notes,
            recordedBy: userId,
        });
        await this.syncDeliveryPaidState(invoice._id, invoice.total, invoice.deliveryId);
        return payment.populate('recordedBy', 'name email');
    }
    static async delete(id) {
        const payment = await Payment_1.Payment.findOne({ _id: id, isDeleted: false });
        if (!payment)
            throw new response_1.AppError('Payment not found', 404);
        payment.isDeleted = true;
        payment.deletedAt = new Date();
        await payment.save();
        const invoice = await Invoice_1.Invoice.findOne({ _id: payment.invoiceId, isDeleted: false });
        if (invoice) {
            await this.syncDeliveryPaidState(invoice._id, invoice.total, invoice.deliveryId);
        }
        return payment;
    }
    static async syncDeliveryPaidState(invoiceId, invoiceTotal, deliveryId) {
        const totals = await this.getTotalsByInvoiceIds([invoiceId]);
        const totalPaid = totals.get(String(invoiceId))?.total ?? 0;
        const status = (0, invoicePaymentStatus_1.computePaymentStatus)(invoiceTotal, totalPaid);
        const isFullyPaid = status === 'paid' || status === 'credit';
        if (deliveryId) {
            await Customer_1.Delivery.findByIdAndUpdate(deliveryId, { paid: isFullyPaid });
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=paymentService.js.map