"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const Customer_1 = require("../models/Customer");
const Transaction_1 = require("../models/Transaction");
const Gallon_1 = require("../models/Gallon");
const Notification_1 = require("../models/Notification");
const User_1 = require("../models/User");
const Product_1 = require("../models/Product");
const InventoryMovement_1 = require("../models/InventoryMovement");
const enums_1 = require("../types/enums");
const deliveryColor_1 = require("../utils/deliveryColor");
const formatBytes_1 = require("../utils/formatBytes");
class DashboardService {
    static async getStats() {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const tomorrow = (0, dayjs_1.default)().endOf('day').toDate();
        const monthStart = (0, dayjs_1.default)().startOf('month').toDate();
        const yesterday = (0, dayjs_1.default)().subtract(1, 'day').startOf('day').toDate();
        const yesterdayEnd = (0, dayjs_1.default)().subtract(1, 'day').endOf('day').toDate();
        const lastMonthStart = (0, dayjs_1.default)().subtract(1, 'month').startOf('month').toDate();
        const lastMonthEnd = (0, dayjs_1.default)().subtract(1, 'month').endOf('month').toDate();
        const [totalCustomers, newCustomersThisMonth, todayDeliveries, deliveredToday, overdueDeliveries, overdue2Days, overdue3Plus, todaySales, yesterdaySales, monthSales, lastMonthSales,] = await Promise.all([
            Customer_1.Customer.countDocuments({ isDeleted: false, status: enums_1.CustomerStatus.ENABLED }),
            Customer_1.Customer.countDocuments({ isDeleted: false, createdAt: { $gte: monthStart } }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow } }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow }, status: 'delivered' }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, status: 'overdue' }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'orange' }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'red' }),
            Transaction_1.Transaction.aggregate([
                { $match: { isDeleted: false, createdAt: { $gte: today, $lte: tomorrow }, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Transaction_1.Transaction.aggregate([
                { $match: { isDeleted: false, createdAt: { $gte: yesterday, $lte: yesterdayEnd }, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Transaction_1.Transaction.aggregate([
                { $match: { isDeleted: false, createdAt: { $gte: monthStart }, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Transaction_1.Transaction.aggregate([
                { $match: { isDeleted: false, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);
        const todaySalesAmount = todaySales[0]?.total || 0;
        const yesterdaySalesAmount = yesterdaySales[0]?.total || 0;
        const monthSalesAmount = monthSales[0]?.total || 0;
        const lastMonthSalesAmount = lastMonthSales[0]?.total || 0;
        const salesGrowth = yesterdaySalesAmount > 0
            ? Math.round(((todaySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) * 100)
            : 0;
        const monthGrowth = lastMonthSalesAmount > 0
            ? Math.round(((monthSalesAmount - lastMonthSalesAmount) / lastMonthSalesAmount) * 100)
            : 0;
        return {
            totalCustomers,
            newCustomersThisMonth,
            todayDeliveries,
            deliveredToday,
            pendingToday: todayDeliveries - deliveredToday,
            overdueDeliveries,
            overdue2Days,
            overdue3Plus,
            todaySales: todaySalesAmount,
            salesGrowth,
            monthSales: monthSalesAmount,
            monthGrowth,
        };
    }
    static async getSales(period, range = 'this-month') {
        let startDate;
        let endDate = (0, dayjs_1.default)().endOf('day').toDate();
        let groupFormat;
        if (range === 'last-month') {
            startDate = (0, dayjs_1.default)().subtract(1, 'month').startOf('month').toDate();
            endDate = (0, dayjs_1.default)().subtract(1, 'month').endOf('month').toDate();
        }
        else {
            startDate = (0, dayjs_1.default)().startOf('month').toDate();
        }
        switch (period) {
            case 'weekly':
                startDate = (0, dayjs_1.default)().subtract(12, 'week').startOf('week').toDate();
                endDate = (0, dayjs_1.default)().endOf('day').toDate();
                groupFormat = '%Y-W%V';
                break;
            case 'monthly':
                startDate = (0, dayjs_1.default)().subtract(12, 'month').startOf('month').toDate();
                endDate = (0, dayjs_1.default)().endOf('day').toDate();
                groupFormat = '%Y-%m';
                break;
            case 'yearly':
                startDate = (0, dayjs_1.default)().subtract(5, 'year').startOf('year').toDate();
                endDate = (0, dayjs_1.default)().endOf('day').toDate();
                groupFormat = '%Y';
                break;
            default:
                if (range === 'last-month') {
                    startDate = (0, dayjs_1.default)().subtract(1, 'month').startOf('month').toDate();
                    endDate = (0, dayjs_1.default)().subtract(1, 'month').endOf('month').toDate();
                }
                else {
                    startDate = (0, dayjs_1.default)().subtract(29, 'day').startOf('day').toDate();
                    endDate = (0, dayjs_1.default)().endOf('day').toDate();
                }
                groupFormat = '%Y-%m-%d';
        }
        const data = await Transaction_1.Transaction.aggregate([
            {
                $match: {
                    isDeleted: false,
                    status: 'paid',
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const mapped = data.map((d) => ({ date: d._id, total: d.total, count: d.count }));
        if (period === 'daily') {
            return this.fillDailySales(mapped, startDate, endDate);
        }
        return mapped;
    }
    static fillDailySales(data, startDate, endDate) {
        const map = new Map(data.map((d) => [d.date, d]));
        const result = [];
        let current = (0, dayjs_1.default)(startDate).startOf('day');
        const end = (0, dayjs_1.default)(endDate).startOf('day');
        while (current.isBefore(end) || current.isSame(end, 'day')) {
            const key = current.format('YYYY-MM-DD');
            const existing = map.get(key);
            result.push({
                date: current.format('MMM D'),
                total: existing?.total ?? 0,
                count: existing?.count ?? 0,
            });
            current = current.add(1, 'day');
        }
        return result;
    }
    static async getDeliveriesOverview() {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const tomorrow = (0, dayjs_1.default)().endOf('day').toDate();
        const [deliveredToday, pendingToday, overdueOrange, overdueRed] = await Promise.all([
            Customer_1.Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow }, status: 'delivered' }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow }, status: 'pending' }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'orange' }),
            Customer_1.Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'red' }),
        ]);
        const todayTotal = deliveredToday + pendingToday;
        return {
            total: todayTotal + overdueOrange + overdueRed,
            todayTotal,
            overdueTotal: overdueOrange + overdueRed,
            breakdown: [
                { name: 'Delivered Today', value: deliveredToday, color: '#52c41a' },
                { name: 'Pending Today', value: pendingToday, color: '#faad14' },
                { name: 'Overdue 2 Days', value: overdueOrange, color: '#fa8c16' },
                { name: 'Overdue 3+ Days', value: overdueRed, color: '#ff4d4f' },
            ],
        };
    }
    static async getInventoryOverview() {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const tomorrow = (0, dayjs_1.default)().endOf('day').toDate();
        const [slimInventory, roundInventory, slimGallon, roundGallon, movementsToday] = await Promise.all([
            Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.SLIM, isDeleted: false }),
            Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.ROUND, isDeleted: false }),
            Gallon_1.Gallon.findOne({ itemKey: enums_1.GallonType.SLIM, isDeleted: false }).sort({ date: -1 }),
            Gallon_1.Gallon.findOne({ itemKey: enums_1.GallonType.ROUND, isDeleted: false }).sort({ date: -1 }),
            InventoryMovement_1.InventoryMovement.countDocuments({
                isDeleted: false,
                date: { $gte: today, $lte: tomorrow },
            }),
        ]);
        const mapStock = (inventory, gallon) => {
            const inStock = inventory?.currentStock ?? 0;
            const threshold = inventory?.lowStockThreshold ?? 10;
            return {
                inStock,
                lowStock: threshold,
                lowStockWarning: inStock <= threshold,
                containersOut: gallon?.currentOut ?? 0,
                containersReturned: gallon?.returned ?? 0,
                netContainersOut: Math.max(0, (gallon?.currentOut ?? 0) - (gallon?.returned ?? 0)),
            };
        };
        return {
            slim: mapStock(slimInventory, slimGallon),
            round: mapStock(roundInventory, roundGallon),
            movementsToday,
        };
    }
    static async getRecentDeliveries(limit = 5) {
        const data = await Customer_1.Delivery.find({ isDeleted: false })
            .populate('customerId', 'fullName phone pricingCategory')
            .sort({ date: -1 })
            .limit(limit)
            .lean();
        return data.map((d) => {
            const resolved = (0, deliveryColor_1.resolveDeliveryState)(d.status, d.date);
            return { ...d, status: resolved.status, colorCode: resolved.colorCode };
        });
    }
    static async getRecentTransactions(limit = 5) {
        return Transaction_1.Transaction.find({ isDeleted: false })
            .populate('customerId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getTopCustomers(limit = 5) {
        const monthStart = (0, dayjs_1.default)().startOf('month').toDate();
        return Transaction_1.Transaction.aggregate([
            {
                $match: {
                    isDeleted: false,
                    status: 'paid',
                    customerId: { $exists: true },
                    createdAt: { $gte: monthStart },
                },
            },
            {
                $group: {
                    _id: '$customerId',
                    totalSpent: { $sum: '$amount' },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: '$customer' },
            {
                $project: {
                    customerId: '$_id',
                    fullName: '$customer.fullName',
                    totalSpent: 1,
                    orderCount: 1,
                },
            },
        ]);
    }
    static async getActivityLogs(limit = 10) {
        return Notification_1.Log.find()
            .populate('userId', 'name role avatar')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getSystemSummary() {
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const tomorrow = (0, dayjs_1.default)().endOf('day').toDate();
        const [totalUsers, totalProducts, totalInventoryItems, lowStockItems, movementsToday, settings, lastBackupDoc, outstandingAgg, dbStats,] = await Promise.all([
            User_1.User.countDocuments({ isDeleted: false, status: enums_1.UserStatus.ACTIVE }),
            Product_1.Product.countDocuments({ isDeleted: false, status: enums_1.ProductStatus.ACTIVE }),
            Gallon_1.Inventory.countDocuments({ isDeleted: false }),
            Gallon_1.Inventory.countDocuments({
                isDeleted: false,
                $expr: { $lte: ['$currentStock', '$lowStockThreshold'] },
            }),
            InventoryMovement_1.InventoryMovement.countDocuments({
                isDeleted: false,
                date: { $gte: today, $lte: tomorrow },
            }),
            Notification_1.Settings.findOne(),
            Notification_1.Backup.findOne().sort({ createdAt: -1 }).select('createdAt filename size'),
            Customer_1.Customer.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        outstandingSlim: { $sum: '$outstandingSlim' },
                        outstandingRound: { $sum: '$outstandingRound' },
                    },
                },
            ]),
            mongoose_1.default.connection.db?.stats().catch(() => null),
        ]);
        const outstanding = outstandingAgg[0] ?? { outstandingSlim: 0, outstandingRound: 0 };
        const databaseConnected = mongoose_1.default.connection.readyState === 1;
        return {
            totalUsers,
            totalProducts,
            totalInventoryItems,
            lowStockItems,
            movementsToday,
            outstandingSlim: outstanding.outstandingSlim ?? 0,
            outstandingRound: outstanding.outstandingRound ?? 0,
            databaseConnected,
            databaseSize: dbStats ? (0, formatBytes_1.formatBytes)(dbStats.dataSize) : null,
            databaseCollections: dbStats?.collections ?? 0,
            lastBackup: lastBackupDoc?.createdAt ?? null,
            lastBackupFilename: lastBackupDoc?.filename ?? null,
            companyName: settings?.companyName || 'H2O Water Refilling',
            version: process.env.npm_package_version || '1.0.0',
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboardService.js.map