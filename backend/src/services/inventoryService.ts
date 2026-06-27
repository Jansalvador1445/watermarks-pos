import { Request } from 'express';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { Gallon, Inventory } from '../models/Gallon';
import { Transaction } from '../models/Transaction';
import { Delivery, Customer } from '../models/Customer';
import { InventoryMovement } from '../models/InventoryMovement';
import { AppError } from '../utils/response';
import { getPagination, buildSearchQuery } from '../utils/pagination';
import { GallonType } from '../types/enums';
import { defaultLabelFromKey, slugifyItemKey } from '../utils/itemKey';
import { InventoryMovementService } from './inventoryMovementService';

interface GallonRecordInput {
  itemKey?: string;
  label?: string;
  type?: GallonType;
  quantity: number;
  remarks?: string;
}

export class GallonService {
  private static resolveItemKey(data: Pick<GallonRecordInput, 'itemKey' | 'label' | 'type'>) {
    const rawKey = data.itemKey?.trim().toLowerCase();
    if (rawKey) return rawKey;
    if (data.type) return data.type;
    if (data.label?.trim()) return slugifyItemKey(data.label);
    throw new AppError('Item is required', 400);
  }

  private static resolveLabel(data: Pick<GallonRecordInput, 'itemKey' | 'label' | 'type'>, itemKey: string) {
    if (data.label?.trim()) return data.label.trim();
    if (data.type === GallonType.SLIM) return 'Slim Container';
    if (data.type === GallonType.ROUND) return 'Round Container';
    return defaultLabelFromKey(itemKey);
  }

  private static async findOrCreateGallon(data: Pick<GallonRecordInput, 'itemKey' | 'label' | 'type'>) {
    const itemKey = this.resolveItemKey(data);
    const label = this.resolveLabel(data, itemKey);

    let gallon = await Gallon.findOne({ itemKey, isDeleted: false }).sort({ createdAt: 1 });
    if (!gallon) {
      gallon = await Gallon.create({
        itemKey,
        label,
        type: data.type,
        currentIn: 0,
        currentOut: 0,
        returned: 0,
      });
    } else if (data.label?.trim() && gallon.label !== data.label.trim()) {
      gallon.label = data.label.trim();
      await gallon.save();
    }

    return gallon;
  }

  static async getOverview() {
    const gallons = await Gallon.find({ isDeleted: false }).sort({ label: 1 }).lean();

    const items = gallons.map((g) => ({
      itemKey: g.itemKey,
      label: g.label,
      type: g.type,
      currentIn: g.currentIn,
      currentOut: g.currentOut,
      returned: g.returned,
    }));

    const findLegacy = (key: string, legacyType: GallonType) =>
      items.find((i) => i.itemKey === key || i.type === legacyType) ?? {
        itemKey: key,
        label: key === 'slim' ? 'Slim Container' : 'Round Container',
        type: legacyType,
        currentIn: 0,
        currentOut: 0,
        returned: 0,
      };

    return {
      items,
      slim: findLegacy('slim', GallonType.SLIM),
      round: findLegacy('round', GallonType.ROUND),
    };
  }

  static async recordOut(data: GallonRecordInput, userId?: string) {
    return this.recordDirection('out', data, userId);
  }

  static async recordReturn(data: GallonRecordInput, userId?: string) {
    return this.recordDirection('return', data, userId);
  }

  private static async recordDirection(
    direction: 'out' | 'return',
    data: GallonRecordInput,
    userId?: string,
  ) {
    const gallon = await this.findOrCreateGallon(data);

    const historyEntry = {
      direction,
      quantity: data.quantity,
      date: new Date(),
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      remarks: data.remarks,
    };

    if (direction === 'out') {
      gallon.currentOut += data.quantity;
    } else {
      if (data.quantity > gallon.currentOut) {
        throw new AppError(
          `Cannot return more than containers currently out (${gallon.currentOut})`,
          400,
        );
      }
      gallon.returned += data.quantity;
      gallon.currentOut -= data.quantity;
    }

    gallon.date = new Date();
    gallon.history.push(historyEntry);
    await gallon.save();
    return gallon;
  }

  /** @deprecated use recordOut / recordReturn */
  static async recordTransaction(
    data: { type: GallonType; action: string; quantity: number; remarks?: string },
    userId?: string,
  ) {
    if (data.action === 'out') return this.recordOut({ type: data.type, quantity: data.quantity, remarks: data.remarks }, userId);
    if (data.action === 'return') return this.recordReturn({ type: data.type, quantity: data.quantity, remarks: data.remarks }, userId);
    if (data.action === 'in') {
      throw new AppError(
        'Water production must be recorded via Inventory → Production. This page tracks container flow (out/return) only.',
        400,
      );
    }
    throw new AppError('Invalid direction', 400);
  }

  static async getHistory(itemKey?: string) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (itemKey) filter.itemKey = itemKey.toLowerCase();

    const gallons = await Gallon.find(filter).sort({ label: 1 }).lean();
    return gallons
      .flatMap((g) =>
        (g.history || []).map((h, index) => ({
          _id: `${g._id}-${index}-${new Date(h.date).getTime()}`,
          itemKey: g.itemKey,
          label: g.label,
          type: g.type,
          direction: h.direction,
          quantity: h.quantity,
          date: h.date,
          remarks: h.remarks,
          userId: h.userId,
          currentOut: g.currentOut,
          returned: g.returned,
        })),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 100);
  }
}

export class InventoryService {
  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { search, category } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (category) filter.category = category;
    Object.assign(filter, buildSearchQuery(search as string, ['name', 'sku', 'category']));

    const [data, total] = await Promise.all([
      Inventory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Inventory.countDocuments(filter),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  static async getById(id: string) {
    const item = await Inventory.findOne({ _id: id, isDeleted: false });
    if (!item) throw new AppError('Inventory item not found', 404);
    return item;
  }

  static async create(data: Record<string, unknown>, userId?: string) {
    const { initialQuantity, ...rest } = data;
    const qty = Math.max(0, Number(initialQuantity) || 0);

    const item = await Inventory.create({ ...rest, currentStock: 0 });

    if (qty > 0) {
      if (!userId) {
        throw new AppError('Initial quantity requires an authenticated user', 400);
      }
      await InventoryMovementService.addProduction(
        item._id.toString(),
        qty,
        'Initial stock on item creation',
        userId,
      );
    }

    return Inventory.findById(item._id);
  }

  static async update(id: string, data: Record<string, unknown>, _userId?: string) {
    const item = await Inventory.findOne({ _id: id, isDeleted: false });
    if (!item) throw new AppError('Inventory item not found', 404);

    const { currentStock, initialQuantity, ...safeData } = data;
    if (currentStock !== undefined || initialQuantity !== undefined) {
      throw new AppError('Direct stock editing is not allowed. Use production or adjustment endpoints.', 400);
    }

    Object.assign(item, safeData);
    await item.save();
    return item;
  }

  static async delete(id: string) {
    const item = await Inventory.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!item) throw new AppError('Inventory item not found', 404);
    return item;
  }
}

export class ReportService {
  static async getSalesReport(startDate: string, endDate: string) {
    return Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          status: 'paid',
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  static async getDeliveryReport(startDate: string, endDate: string) {
    return Delivery.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  static async getCustomerReport() {
    const [statusCounts, outstanding] = await Promise.all([
      Customer.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            outstandingSlim: { $sum: '$outstandingSlim' },
            outstandingRound: { $sum: '$outstandingRound' },
            withOutstanding: {
              $sum: {
                $cond: [{ $gt: [{ $add: ['$outstandingSlim', '$outstandingRound'] }, 0] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    return {
      statusCounts,
      outstanding: outstanding[0] ?? {
        totalCustomers: 0,
        outstandingSlim: 0,
        outstandingRound: 0,
        withOutstanding: 0,
      },
    };
  }

  static async getInventoryReport(startDate?: string, endDate?: string) {
    const dateFilter: Record<string, Date> = {};
    if (startDate && endDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$lte = new Date(endDate);
    } else {
      dateFilter.$gte = dayjs().startOf('month').toDate();
      dateFilter.$lte = dayjs().endOf('month').toDate();
    }

    const [items, movementSummary, recentMovements] = await Promise.all([
      Inventory.find({ isDeleted: false }).lean(),
      InventoryMovement.aggregate([
        { $match: { isDeleted: false, date: dateFilter } },
        {
          $group: {
            _id: '$movementType',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
        { $sort: { count: -1 } },
      ]),
      InventoryMovement.find({ isDeleted: false, date: dateFilter })
        .populate('itemId', 'name category unit')
        .populate('userId', 'name')
        .sort({ date: -1 })
        .limit(50)
        .lean(),
    ]);

    return { items, movementSummary, recentMovements, period: { startDate: dateFilter.$gte, endDate: dateFilter.$lte } };
  }
}
