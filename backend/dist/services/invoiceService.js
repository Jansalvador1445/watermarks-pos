"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterOrderService = exports.InvoiceService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Invoice_1 = require("../models/Invoice");
const Customer_1 = require("../models/Customer");
const Product_1 = require("../models/Product");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
function calcLineSubtotal(item) {
    const discount = item.discount ?? 0;
    return Math.max(0, item.quantity * item.unitPrice - discount);
}
function calcTotals(items, tax = 0) {
    const lineItems = items.map((item) => ({
        ...item,
        discount: item.discount ?? 0,
        subtotal: calcLineSubtotal(item),
    }));
    const subtotal = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
    const total = subtotal + tax;
    return { lineItems, subtotal, tax, total };
}
class InvoiceService {
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { status, search } = req.query;
        const filter = { isDeleted: false, legacyWaterOrder: { $ne: true } };
        if (status)
            filter.status = status;
        const [data, total] = await Promise.all([
            Invoice_1.Invoice.find(filter)
                .populate('customerId', 'fullName phone address')
                .populate('createdBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Invoice_1.Invoice.countDocuments(filter),
        ]);
        let filtered = data;
        if (search && typeof search === 'string') {
            const regex = new RegExp(search.trim(), 'i');
            filtered = data.filter((inv) => {
                const customer = inv.customerId;
                return (inv.invoiceNo?.match(regex) ||
                    customer?.fullName?.match(regex) ||
                    customer?.phone?.match(regex));
            });
        }
        return { data: filtered, pagination: { page, limit, total: search ? filtered.length : total } };
    }
    static async getById(id) {
        const invoice = await Invoice_1.Invoice.findOne({ _id: id, isDeleted: false })
            .populate('customerId', 'fullName phone address pricingCategory')
            .populate('createdBy', 'name email')
            .lean();
        if (!invoice)
            throw new response_1.AppError('Invoice not found', 404);
        return invoice;
    }
    static async create(data, userId) {
        const customerId = String(data.customerId);
        const customer = await Customer_1.Customer.findOne({ _id: customerId, isDeleted: false });
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        const rawItems = data.items || [];
        const resolvedItems = await this.resolveItems(rawItems);
        const tax = Number(data.tax) || 0;
        const { lineItems, subtotal, total } = calcTotals(resolvedItems, tax);
        return Invoice_1.Invoice.create({
            customerId,
            items: lineItems,
            subtotal,
            tax,
            total,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            createdBy: userId,
            status: Invoice_1.InvoiceStatus.PENDING,
        });
    }
    static async update(id, data) {
        const invoice = await Invoice_1.Invoice.findOne({ _id: id, isDeleted: false });
        if (!invoice)
            throw new response_1.AppError('Invoice not found', 404);
        if (invoice.status === Invoice_1.InvoiceStatus.CONVERTED) {
            throw new response_1.AppError('Cannot update a converted invoice', 400);
        }
        if (data.status && data.status === Invoice_1.InvoiceStatus.CONVERTED) {
            throw new response_1.AppError('Use convert endpoint to mark as converted', 400);
        }
        const updatePayload = { ...data };
        delete updatePayload.items;
        if (data.items) {
            const resolvedItems = await this.resolveItems(data.items);
            const tax = data.tax !== undefined ? Number(data.tax) : invoice.tax;
            const { lineItems, subtotal, total } = calcTotals(resolvedItems, tax);
            updatePayload.items = lineItems;
            updatePayload.subtotal = subtotal;
            updatePayload.total = total;
            updatePayload.tax = tax;
        }
        const updated = await Invoice_1.Invoice.findOneAndUpdate({ _id: id, isDeleted: false }, updatePayload, { new: true, runValidators: true })
            .populate('customerId', 'fullName phone address')
            .populate('createdBy', 'name email');
        return updated;
    }
    static async delete(id) {
        const invoice = await Invoice_1.Invoice.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!invoice)
            throw new response_1.AppError('Invoice not found', 404);
        return invoice;
    }
    static async convertToDelivery(id, userId) {
        const invoice = await Invoice_1.Invoice.findOne({ _id: id, isDeleted: false }).populate('customerId', 'fullName');
        if (!invoice)
            throw new response_1.AppError('Invoice not found', 404);
        if (invoice.status === Invoice_1.InvoiceStatus.CONVERTED) {
            throw new response_1.AppError('Invoice already converted', 400);
        }
        if (invoice.status === Invoice_1.InvoiceStatus.REJECTED) {
            throw new response_1.AppError('Cannot convert a rejected invoice', 400);
        }
        const customer = invoice.customerId;
        let slimOut = 0;
        let roundOut = 0;
        for (const item of invoice.items) {
            if (!item.productId)
                continue;
            const product = await Product_1.Product.findById(item.productId);
            if (product?.gallonType === enums_1.GallonType.SLIM)
                slimOut += item.quantity;
            if (product?.gallonType === enums_1.GallonType.ROUND)
                roundOut += item.quantity;
        }
        const deliveryData = {
            customerId: customer._id,
            date: new Date(),
            schedule: 'Daily',
            status: 'pending',
            colorCode: 'white',
            paid: false,
            discount: 0,
            slimOut,
            roundOut,
            slimIn: 0,
            roundIn: 0,
            slimReturn: 0,
            roundReturn: 0,
            remarks: invoice.notes ? `From invoice ${invoice.invoiceNo}: ${invoice.notes}` : `Converted from invoice ${invoice.invoiceNo}`,
        };
        if (userId)
            deliveryData.assignedStaffId = userId;
        const delivery = await Customer_1.Delivery.create(deliveryData);
        invoice.status = Invoice_1.InvoiceStatus.CONVERTED;
        invoice.deliveryId = delivery._id;
        await invoice.save();
        const populated = await Invoice_1.Invoice.findById(invoice._id)
            .populate('customerId', 'fullName phone address')
            .populate('createdBy', 'name email')
            .lean();
        return { invoice: populated, delivery };
    }
    static async resolveItems(items) {
        const resolved = [];
        for (const item of items) {
            if (item.productId && mongoose_1.default.Types.ObjectId.isValid(item.productId)) {
                const product = await Product_1.Product.findOne({ _id: item.productId, isDeleted: false, status: enums_1.ProductStatus.ACTIVE });
                if (!product)
                    throw new response_1.AppError(`Product not found: ${item.productId}`, 400);
                resolved.push({
                    productId: item.productId,
                    name: product.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice ?? product.price,
                    discount: item.discount,
                });
            }
            else {
                resolved.push(item);
            }
        }
        return resolved;
    }
}
exports.InvoiceService = InvoiceService;
exports.WaterOrderService = InvoiceService;
//# sourceMappingURL=invoiceService.js.map