"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const Transaction_1 = require("../models/Transaction");
const Customer_1 = require("../models/Customer");
const enums_1 = require("../types/enums");
class CollectionService {
    static async getDaily(dateStr) {
        const date = dateStr ? (0, dayjs_1.default)(dateStr) : (0, dayjs_1.default)();
        const start = date.startOf('day').toDate();
        const end = date.endOf('day').toDate();
        const [transactions, deliveries] = await Promise.all([
            Transaction_1.Transaction.find({
                isDeleted: false,
                status: enums_1.TransactionStatus.PAID,
                createdAt: { $gte: start, $lte: end },
            })
                .populate('customerId', 'fullName phone')
                .sort({ createdAt: -1 })
                .lean(),
            Customer_1.Delivery.find({
                isDeleted: false,
                date: { $gte: start, $lte: end },
            })
                .populate({
                path: 'customerId',
                select: 'fullName phone pricingCategory',
                populate: { path: 'pricingCategory', select: 'slimPrice roundPrice' },
            })
                .populate('assignedStaffId', 'name')
                .sort({ date: -1 })
                .lean(),
        ]);
        const summary = { cash: 0, gcash: 0, bank: 0, total: 0 };
        transactions.forEach((tx) => {
            const amount = tx.amount - (tx.discount || 0);
            summary[tx.paymentMethod] =
                summary[tx.paymentMethod] + amount;
            summary.total += amount;
        });
        const transactionItems = transactions.map((tx) => ({
            id: tx._id,
            customer: tx.customerId?.fullName || tx.customerName || 'Walk-in',
            amount: tx.amount - (tx.discount || 0),
            paymentMethod: tx.paymentMethod,
            paid: tx.status === enums_1.TransactionStatus.PAID,
            type: tx.type,
            source: 'transaction',
            createdAt: tx.createdAt,
        }));
        const deliveryItems = deliveries.map((d) => {
            const customer = d.customerId;
            const tier = customer?.pricingCategory && typeof customer.pricingCategory === 'object'
                ? customer.pricingCategory
                : { slimPrice: 0, roundPrice: 0 };
            const amount = (d.slimOut || 0) * (tier.slimPrice || 0) +
                (d.roundOut || 0) * (tier.roundPrice || 0) -
                (d.discount || 0);
            return {
                id: d._id,
                customer: customer?.fullName || 'Unknown',
                amount: Math.max(amount, 0),
                paymentMethod: d.paid ? 'cash' : 'pending',
                paid: d.paid,
                type: 'delivery',
                source: 'delivery',
                staff: d.assignedStaffId?.name,
                createdAt: d.date,
            };
        });
        const unpaidTotal = deliveryItems.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0);
        return {
            date: date.format('YYYY-MM-DD'),
            summary,
            unpaidTotal,
            items: [...transactionItems, ...deliveryItems],
        };
    }
}
exports.CollectionService = CollectionService;
//# sourceMappingURL=collectionService.js.map