"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const Transaction_1 = require("../models/Transaction");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
const inventoryMovementService_1 = require("./inventoryMovementService");
const productService_1 = require("./productService");
const secureReference_1 = require("../utils/secureReference");
const generateInvoiceNo = () => (0, secureReference_1.generateSecureReference)('INV');
const STOCK_TRANSACTION_TYPES = new Set([enums_1.TransactionType.POS, enums_1.TransactionType.WALKIN]);
class TransactionService {
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { search, type, types, status, startDate, endDate } = req.query;
        const filter = { isDeleted: false };
        if (types && typeof types === 'string') {
            const typeList = types.split(',').map((t) => t.trim()).filter(Boolean);
            if (typeList.length > 0)
                filter.type = { $in: typeList };
        }
        else if (type) {
            filter.type = type;
        }
        if (status)
            filter.status = status;
        if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        Object.assign(filter, (0, pagination_1.buildSearchQuery)(search, ['invoiceNo', 'customerName']));
        const [data, total] = await Promise.all([
            Transaction_1.Transaction.find(filter)
                .populate('customerId', 'fullName phone')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction_1.Transaction.countDocuments(filter),
        ]);
        return { data, pagination: { page, limit, total } };
    }
    static async getById(id) {
        const transaction = await Transaction_1.Transaction.findOne({ _id: id, isDeleted: false }).populate('customerId', 'fullName address phone');
        if (!transaction)
            throw new response_1.AppError('Transaction not found', 404);
        return transaction;
    }
    static async create(data, userId) {
        const type = data.type;
        const discount = Math.max(0, data.discount || 0);
        const status = enums_1.TransactionStatus.PAID;
        const invoiceNo = generateInvoiceNo();
        return inventoryMovementService_1.InventoryMovementService.withTransaction(async (session) => {
            let resolvedItems;
            if (type === enums_1.TransactionType.POS || type === enums_1.TransactionType.WALKIN) {
                const catalogItems = data.items;
                const customerId = data.customerId ? String(data.customerId) : undefined;
                const resolved = await productService_1.ProductService.resolveCatalogItems(catalogItems, session, customerId);
                resolvedItems = resolved;
            }
            else {
                resolvedItems = data.items.map((item) => ({
                    name: item.name.trim(),
                    quantity: item.quantity,
                    price: item.price,
                    gallonType: item.gallonType,
                    decrementsStock: false,
                }));
            }
            const subtotal = resolvedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
            if (discount > subtotal) {
                throw new response_1.AppError('Discount cannot exceed subtotal', 400);
            }
            const amount = subtotal - discount;
            if (status === enums_1.TransactionStatus.PAID && STOCK_TRANSACTION_TYPES.has(type)) {
                await inventoryMovementService_1.InventoryMovementService.processTransactionStock(session, {
                    type,
                    invoiceNo,
                    items: resolvedItems,
                }, userId);
            }
            const transaction = new Transaction_1.Transaction({
                type,
                customerId: data.customerId,
                customerName: data.customerName,
                items: resolvedItems,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                invoiceNo,
                amount,
                discount,
                status,
            });
            await transaction.save({ session: session || undefined });
            return transaction;
        });
    }
    static async update(id, data) {
        const allowedFields = new Set(['notes']);
        const disallowed = Object.keys(data).filter((key) => data[key] !== undefined && !allowedFields.has(key));
        if (disallowed.length > 0) {
            throw new response_1.AppError('Only notes can be updated on a completed transaction', 400);
        }
        const transaction = await Transaction_1.Transaction.findOneAndUpdate({ _id: id, isDeleted: false }, { notes: data.notes }, { new: true, runValidators: true });
        if (!transaction)
            throw new response_1.AppError('Transaction not found', 404);
        return transaction;
    }
    static async delete(id, userId) {
        const existing = await Transaction_1.Transaction.findOne({ _id: id, isDeleted: false });
        if (!existing)
            throw new response_1.AppError('Transaction not found', 404);
        return inventoryMovementService_1.InventoryMovementService.withTransaction(async (session) => {
            const transaction = await Transaction_1.Transaction.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true, session: session || undefined });
            if (!transaction)
                throw new response_1.AppError('Transaction not found', 404);
            if (transaction.status === enums_1.TransactionStatus.PAID &&
                STOCK_TRANSACTION_TYPES.has(transaction.type)) {
                await inventoryMovementService_1.InventoryMovementService.reverseTransactionStock(session, {
                    invoiceNo: transaction.invoiceNo,
                    items: transaction.items.map((item) => ({
                        name: item.name,
                        quantity: item.quantity,
                        gallonType: item.gallonType,
                        decrementsStock: item.decrementsStock,
                    })),
                }, userId);
            }
            return transaction;
        });
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transactionService.js.map