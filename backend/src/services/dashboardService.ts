import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { Customer, Delivery } from '../models/Customer';
import { Transaction } from '../models/Transaction';
import { Inventory, Gallon } from '../models/Gallon';
import { Log, Settings, Backup } from '../models/Notification';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { InventoryMovement } from '../models/InventoryMovement';
import { CustomerStatus, GallonType, UserStatus, ProductStatus } from '../types/enums';
import { resolveDeliveryState } from '../utils/deliveryColor';
import { formatBytes } from '../utils/formatBytes';

export class DashboardService {
  static async getStats() {
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate();
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const [
      totalCustomers,
      newCustomersThisMonth,
      todayDeliveries,
      deliveredToday,
      overdueDeliveries,
      overdue2Days,
      overdue3Plus,
      todaySales,
      yesterdaySales,
      monthSales,
      lastMonthSales,
    ] = await Promise.all([
      Customer.countDocuments({ isDeleted: false, status: CustomerStatus.ENABLED }),
      Customer.countDocuments({ isDeleted: false, createdAt: { $gte: monthStart } }),
      Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow } }),
      Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow }, status: 'delivered' }),
      Delivery.countDocuments({ isDeleted: false, status: 'overdue' }),
      Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'orange' }),
      Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'red' }),
      Transaction.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: today, $lte: tomorrow }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: yesterday, $lte: yesterdayEnd }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: monthStart }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const todaySalesAmount = todaySales[0]?.total || 0;
    const yesterdaySalesAmount = yesterdaySales[0]?.total || 0;
    const monthSalesAmount = monthSales[0]?.total || 0;
    const lastMonthSalesAmount = lastMonthSales[0]?.total || 0;

    const salesGrowth =
      yesterdaySalesAmount > 0
        ? Math.round(((todaySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) * 100)
        : 0;

    const monthGrowth =
      lastMonthSalesAmount > 0
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

  static async getSales(period: string, range = 'this-month') {
    let startDate: Date;
    let endDate: Date = dayjs().endOf('day').toDate();
    let groupFormat: string;

    if (range === 'last-month') {
      startDate = dayjs().subtract(1, 'month').startOf('month').toDate();
      endDate = dayjs().subtract(1, 'month').endOf('month').toDate();
    } else {
      startDate = dayjs().startOf('month').toDate();
    }

    switch (period) {
      case 'weekly':
        startDate = dayjs().subtract(12, 'week').startOf('week').toDate();
        endDate = dayjs().endOf('day').toDate();
        groupFormat = '%Y-W%V';
        break;
      case 'monthly':
        startDate = dayjs().subtract(12, 'month').startOf('month').toDate();
        endDate = dayjs().endOf('day').toDate();
        groupFormat = '%Y-%m';
        break;
      case 'yearly':
        startDate = dayjs().subtract(5, 'year').startOf('year').toDate();
        endDate = dayjs().endOf('day').toDate();
        groupFormat = '%Y';
        break;
      default:
        if (range === 'last-month') {
          startDate = dayjs().subtract(1, 'month').startOf('month').toDate();
          endDate = dayjs().subtract(1, 'month').endOf('month').toDate();
        } else {
          startDate = dayjs().subtract(29, 'day').startOf('day').toDate();
          endDate = dayjs().endOf('day').toDate();
        }
        groupFormat = '%Y-%m-%d';
    }

    const data = await Transaction.aggregate([
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

  private static fillDailySales(
    data: Array<{ date: string; total: number; count: number }>,
    startDate: Date,
    endDate: Date,
  ) {
    const map = new Map(data.map((d) => [d.date, d]));
    const result: Array<{ date: string; total: number; count: number }> = [];
    let current = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).startOf('day');

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
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();

    const [deliveredToday, pendingToday, overdueOrange, overdueRed] = await Promise.all([
      Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow }, status: 'delivered' }),
      Delivery.countDocuments({ isDeleted: false, date: { $gte: today, $lte: tomorrow }, status: 'pending' }),
      Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'orange' }),
      Delivery.countDocuments({ isDeleted: false, status: 'overdue', colorCode: 'red' }),
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
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();

    const [slimInventory, roundInventory, slimGallon, roundGallon, movementsToday] = await Promise.all([
      Inventory.findOne({ refillType: GallonType.SLIM, isDeleted: false }),
      Inventory.findOne({ refillType: GallonType.ROUND, isDeleted: false }),
      Gallon.findOne({ itemKey: GallonType.SLIM, isDeleted: false }).sort({ date: -1 }),
      Gallon.findOne({ itemKey: GallonType.ROUND, isDeleted: false }).sort({ date: -1 }),
      InventoryMovement.countDocuments({
        isDeleted: false,
        date: { $gte: today, $lte: tomorrow },
      }),
    ]);

    const mapStock = (inventory: typeof slimInventory, gallon: typeof slimGallon) => {
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
    const data = await Delivery.find({ isDeleted: false })
      .populate('customerId', 'fullName phone pricingCategory')
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return data.map((d) => {
      const resolved = resolveDeliveryState(d.status, d.date);
      return { ...d, status: resolved.status, colorCode: resolved.colorCode };
    });
  }

  static async getRecentTransactions(limit = 5) {
    return Transaction.find({ isDeleted: false })
      .populate('customerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getTopCustomers(limit = 5) {
    const monthStart = dayjs().startOf('month').toDate();

    return Transaction.aggregate([
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
    return Log.find()
      .populate('userId', 'name role avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getSystemSummary() {
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();

    const [
      totalUsers,
      totalProducts,
      totalInventoryItems,
      lowStockItems,
      movementsToday,
      settings,
      lastBackupDoc,
      outstandingAgg,
      dbStats,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false, status: UserStatus.ACTIVE }),
      Product.countDocuments({ isDeleted: false, status: ProductStatus.ACTIVE }),
      Inventory.countDocuments({ isDeleted: false }),
      Inventory.countDocuments({
        isDeleted: false,
        $expr: { $lte: ['$currentStock', '$lowStockThreshold'] },
      }),
      InventoryMovement.countDocuments({
        isDeleted: false,
        date: { $gte: today, $lte: tomorrow },
      }),
      Settings.findOne(),
      Backup.findOne().sort({ createdAt: -1 }).select('createdAt filename size'),
      Customer.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            outstandingSlim: { $sum: '$outstandingSlim' },
            outstandingRound: { $sum: '$outstandingRound' },
          },
        },
      ]),
      mongoose.connection.db?.stats().catch(() => null),
    ]);

    const outstanding = outstandingAgg[0] ?? { outstandingSlim: 0, outstandingRound: 0 };
    const databaseConnected = mongoose.connection.readyState === 1;

    return {
      totalUsers,
      totalProducts,
      totalInventoryItems,
      lowStockItems,
      movementsToday,
      outstandingSlim: outstanding.outstandingSlim ?? 0,
      outstandingRound: outstanding.outstandingRound ?? 0,
      databaseConnected,
      databaseSize: dbStats ? formatBytes(dbStats.dataSize) : null,
      databaseCollections: dbStats?.collections ?? 0,
      lastBackup: lastBackupDoc?.createdAt ?? null,
      lastBackupFilename: lastBackupDoc?.filename ?? null,
      companyName: settings?.companyName || 'Water Refilling Station POS',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}
