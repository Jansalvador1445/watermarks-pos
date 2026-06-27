import { Request } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { Inventory } from '../models/Gallon';
import { InventoryMovement } from '../models/InventoryMovement';
import { Customer } from '../models/Customer';
import { Log, Notification, Settings } from '../models/Notification';
import { AppError } from '../utils/response';
import { getPagination } from '../utils/pagination';
import {
  GallonType,
  InventoryMovementType,
  NotificationType,
  TransactionType,
} from '../types/enums';
import { generateSecureReference } from '../utils/secureReference';
import { resolveDocumentId } from '../utils/resolveDocumentId';

export interface StockEventPayload {
  inventoryId: string;
  movementType: InventoryMovementType;
  quantity: number;
  referenceNo: string;
  userId: string;
  remarks?: string;
}

export interface ReturnEventPayload {
  inventoryId: string;
  quantity: number;
  referenceNo: string;
  userId: string;
  remarks?: string;
}

const isTransactionUnsupported = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('mongos') ||
    message.includes('retryable writes') ||
    message.includes('retryWrites=false')
  );
};

export class InventoryMovementService {
  static async withTransaction<T>(fn: (session?: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result!: T;
      try {
        await session.withTransaction(async () => {
          result = await fn(session);
        });
      } catch (error) {
        if (isTransactionUnsupported(error)) {
          result = await fn(undefined);
        } else {
          throw error;
        }
      }
      return result;
    } finally {
      await session.endSession();
    }
  }

  static async findInventoryByType(type: GallonType, session?: ClientSession | null) {
    const query = Inventory.findOne({ refillType: type, isDeleted: false }).sort({ createdAt: 1 });
    if (session) query.session(session);
    const item = await query;
    if (!item) throw new AppError(`No inventory item linked for refill type: ${type}`, 404);
    return item;
  }

  static async findInventoryByProductLink(productId: string, session?: ClientSession | null) {
    const { Product } = await import('../models/Product');
    const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session || null);
    if (!product) throw new AppError('Product not found', 404);

    if (product.linkedInventoryId) {
      const query = Inventory.findOne({ _id: product.linkedInventoryId, isDeleted: false });
      if (session) query.session(session);
      const item = await query;
      if (!item) throw new AppError('Linked inventory item not found', 404);
      return item;
    }

    if (product.gallonType) {
      return this.findInventoryByType(product.gallonType, session);
    }

    throw new AppError(`Product "${product.name}" has no linked inventory for stock tracking`, 400);
  }

  private static async movementExists(
    filter: { referenceNo: string; itemId: mongoose.Types.ObjectId; movementType: InventoryMovementType },
    session?: ClientSession,
  ) {
    const query = InventoryMovement.findOne({ ...filter, isDeleted: false });
    if (session) query.session(session);
    return query.lean();
  }

  static async applyStockEvent(session: ClientSession | undefined, payload: StockEventPayload) {
    const { inventoryId, movementType, quantity, referenceNo, userId, remarks } = payload;

    const itemOid = new mongoose.Types.ObjectId(inventoryId);
    const existing = await this.movementExists(
      { referenceNo, itemId: itemOid, movementType },
      session,
    );
    if (existing) {
      const item = await Inventory.findById(inventoryId);
      return {
        item,
        beforeStock: existing.beforeStock,
        afterStock: existing.afterStock,
        skipped: true,
      };
    }

    const decrease = quantity < 0 ? Math.abs(quantity) : 0;
    const filter: Record<string, unknown> = {
      _id: inventoryId,
      isDeleted: false,
    };
    if (quantity < 0) {
      filter.currentStock = { $gte: decrease };
    }

    const beforeDoc = await Inventory.findOne(filter).session(session || null);
    if (!beforeDoc) {
      const check = await Inventory.findOne({ _id: inventoryId, isDeleted: false }).session(session || null);
      if (!check) throw new AppError('Inventory item not found', 404);
      throw new AppError(
        `Insufficient stock for ${check.name}. Available: ${check.currentStock}, requested: ${decrease}`,
        400,
      );
    }

    const beforeStock = beforeDoc.currentStock;
    const item = await Inventory.findOneAndUpdate(
      filter,
      { $inc: { currentStock: quantity } },
      { new: true, session: session || undefined },
    );
    if (!item) {
      throw new AppError('Insufficient stock for this operation', 400);
    }

    const afterStock = item.currentStock;

    await InventoryMovement.create(
      [
        {
          date: new Date(),
          itemId: item._id,
          movementType,
          quantity,
          beforeStock,
          afterStock,
          referenceNo,
          userId: new mongoose.Types.ObjectId(userId),
          remarks,
        },
      ],
      session ? { session } : {},
    );

    await Log.create(
      [
        {
          userId: new mongoose.Types.ObjectId(userId),
          action: `${movementType}: ${quantity > 0 ? '+' : ''}${quantity} ${item.name}`,
          module: 'inventory',
          metadata: {
            inventoryId: item._id,
            movementType,
            quantity,
            beforeStock,
            afterStock,
            referenceNo,
          },
        },
      ],
      session ? { session } : {},
    );

    if (afterStock <= item.lowStockThreshold) {
      await this.sendLowStockNotification(item.name, item._id.toString(), afterStock, item.lowStockThreshold, session);
    }

    return { item, beforeStock, afterStock };
  }

  static async recordReturnEvent(session: ClientSession | undefined, payload: ReturnEventPayload) {
    const { inventoryId, quantity, referenceNo, userId, remarks } = payload;
    if (quantity <= 0) return;

    const itemOid = new mongoose.Types.ObjectId(inventoryId);
    const existing = await this.movementExists(
      { referenceNo, itemId: itemOid, movementType: InventoryMovementType.RETURN },
      session,
    );
    if (existing) return;

    const item = await Inventory.findOne({ _id: inventoryId, isDeleted: false }).session(
      session || null,
    );
    if (!item) throw new AppError('Inventory item not found', 404);

    const stock = item.currentStock;

    await InventoryMovement.create(
      [
        {
          date: new Date(),
          itemId: item._id,
          movementType: InventoryMovementType.RETURN,
          quantity,
          beforeStock: stock,
          afterStock: stock,
          referenceNo,
          userId: new mongoose.Types.ObjectId(userId),
          remarks,
        },
      ],
      session ? { session } : {},
    );

    await Log.create(
      [
        {
          userId: new mongoose.Types.ObjectId(userId),
          action: `return: ${quantity} ${item.name} (no stock change)`,
          module: 'inventory',
          metadata: { inventoryId: item._id, quantity, referenceNo },
        },
      ],
      session ? { session } : {},
    );
  }

  static async updateCustomerOutstanding(
    session: ClientSession | undefined,
    customerId: string,
    slimDelta: number,
    roundDelta: number,
    userId: string,
    referenceNo?: string,
  ) {
    if (slimDelta === 0 && roundDelta === 0) return null;

    if (referenceNo) {
      const existingLog = await Log.findOne({
        module: 'customers',
        'metadata.referenceNo': referenceNo,
        'metadata.type': 'outstanding_update',
      }).session(session || null);
      if (existingLog) return null;
    }

    const customer = await Customer.findOne({ _id: customerId, isDeleted: false }).session(session || null);
    if (!customer) throw new AppError('Customer not found', 404);

    const previousSlim = customer.outstandingSlim ?? 0;
    const previousRound = customer.outstandingRound ?? 0;
    const newSlim = previousSlim + slimDelta;
    const newRound = previousRound + roundDelta;

    if (newSlim < 0 || newRound < 0) {
      throw new AppError('Customer outstanding gallons cannot be negative', 400);
    }

    customer.outstandingSlim = newSlim;
    customer.outstandingRound = newRound;
    await customer.save(session ? { session } : undefined);

    await Log.create(
      [
        {
          userId: new mongoose.Types.ObjectId(userId),
          action: `Outstanding gallons updated (slim ${slimDelta >= 0 ? '+' : ''}${slimDelta}, round ${roundDelta >= 0 ? '+' : ''}${roundDelta})`,
          module: 'customers',
          metadata: {
            type: 'outstanding_update',
            referenceNo,
            customerId: customer._id,
            previousSlim,
            previousRound,
            newSlim,
            newRound,
            slimDelta,
            roundDelta,
          },
        },
      ],
      session ? { session } : {},
    );

    return customer;
  }

  static async processDeliveryCompleted(
    session: ClientSession | undefined,
    delivery: {
      referenceNo: string;
      customerId: mongoose.Types.ObjectId | string;
      slimOut: number;
      roundOut: number;
      slimReturn: number;
      roundReturn: number;
    },
    userId: string,
  ) {
    const referenceNo = delivery.referenceNo;

    if (delivery.slimOut > 0) {
      const slimInventory = await this.findInventoryByType(GallonType.SLIM, session);
      await this.applyStockEvent(session, {
        inventoryId: slimInventory._id.toString(),
        movementType: InventoryMovementType.DELIVERY,
        quantity: -delivery.slimOut,
        referenceNo,
        userId,
        remarks: `Delivery completed — ${delivery.slimOut} slim gallon(s) out`,
      });
    }

    if (delivery.roundOut > 0) {
      const roundInventory = await this.findInventoryByType(GallonType.ROUND, session);
      await this.applyStockEvent(session, {
        inventoryId: roundInventory._id.toString(),
        movementType: InventoryMovementType.DELIVERY,
        quantity: -delivery.roundOut,
        referenceNo,
        userId,
        remarks: `Delivery completed — ${delivery.roundOut} round gallon(s) out`,
      });
    }

    if (delivery.slimReturn > 0) {
      const slimInventory = await this.findInventoryByType(GallonType.SLIM, session);
      await this.recordReturnEvent(session, {
        inventoryId: slimInventory._id.toString(),
        quantity: delivery.slimReturn,
        referenceNo,
        userId,
        remarks: `Customer returned ${delivery.slimReturn} slim gallon(s)`,
      });
    }

    if (delivery.roundReturn > 0) {
      const roundInventory = await this.findInventoryByType(GallonType.ROUND, session);
      await this.recordReturnEvent(session, {
        inventoryId: roundInventory._id.toString(),
        quantity: delivery.roundReturn,
        referenceNo,
        userId,
        remarks: `Customer returned ${delivery.roundReturn} round gallon(s)`,
      });
    }

    await this.updateCustomerOutstanding(
      session,
      resolveDocumentId(delivery.customerId, 'customerId'),
      delivery.slimOut - delivery.slimReturn,
      delivery.roundOut - delivery.roundReturn,
      userId,
      referenceNo,
    );
  }

  static async processTransactionStock(
    session: ClientSession | undefined,
    transaction: {
      type: TransactionType;
      invoiceNo: string;
      items: Array<{
        name: string;
        quantity: number;
        gallonType?: string;
        decrementsStock?: boolean;
        productId?: string;
      }>;
    },
    userId: string,
  ) {
    const movementType =
      transaction.type === TransactionType.POS
        ? InventoryMovementType.POS_SALE
        : transaction.type === TransactionType.WALKIN
          ? InventoryMovementType.WALKIN_SALE
          : null;

    if (!movementType) return;

    for (const item of transaction.items) {
      if (!item.decrementsStock) continue;

      let inventory;
      if ((item as { productId?: string }).productId) {
        inventory = await this.findInventoryByProductLink((item as { productId: string }).productId, session);
      } else if (
        item.gallonType &&
        (item.gallonType === GallonType.SLIM || item.gallonType === GallonType.ROUND)
      ) {
        inventory = await this.findInventoryByType(item.gallonType as GallonType, session);
      } else {
        continue;
      }

      await this.applyStockEvent(session, {
        inventoryId: inventory._id.toString(),
        movementType,
        quantity: -item.quantity,
        referenceNo: transaction.invoiceNo,
        userId,
        remarks: `${transaction.type} sale — ${item.name} x${item.quantity}`,
      });
    }
  }

  static async reverseTransactionStock(
    session: ClientSession | undefined,
    transaction: {
      invoiceNo: string;
      items: Array<{
        name: string;
        quantity: number;
        gallonType?: string;
        decrementsStock?: boolean;
        productId?: string;
      }>;
    },
    userId: string,
  ) {
    const referenceNo = `REV-${transaction.invoiceNo}`;

    for (const item of transaction.items) {
      if (!item.decrementsStock) continue;

      let inventory;
      if ((item as { productId?: string }).productId) {
        inventory = await this.findInventoryByProductLink((item as { productId: string }).productId, session);
      } else if (
        item.gallonType &&
        (item.gallonType === GallonType.SLIM || item.gallonType === GallonType.ROUND)
      ) {
        inventory = await this.findInventoryByType(item.gallonType as GallonType, session);
      } else {
        continue;
      }

      await this.applyStockEvent(session, {
        inventoryId: inventory._id.toString(),
        movementType: InventoryMovementType.ADJUSTMENT,
        quantity: item.quantity,
        referenceNo,
        userId,
        remarks: `Reversal of sale ${transaction.invoiceNo} — ${item.name} x${item.quantity}`,
      });
    }
  }

  static async addProduction(inventoryId: string, quantity: number, remarks: string, userId: string) {
    if (quantity <= 0) throw new AppError('Production quantity must be greater than 0', 400);

    return this.withTransaction(async (session) => {
      const referenceNo = generateSecureReference('PROD');
      return this.applyStockEvent(session, {
        inventoryId,
        movementType: InventoryMovementType.PRODUCTION,
        quantity,
        referenceNo,
        userId,
        remarks,
      });
    });
  }

  static async manualAdjust(inventoryId: string, quantity: number, reason: string, userId: string) {
    if (quantity === 0) throw new AppError('Adjustment quantity cannot be zero', 400);
    if (!reason?.trim()) throw new AppError('Adjustment reason is required', 400);

    return this.withTransaction(async (session) => {
      const referenceNo = generateSecureReference('ADJ');
      return this.applyStockEvent(session, {
        inventoryId,
        movementType: InventoryMovementType.ADJUSTMENT,
        quantity,
        referenceNo,
        userId,
        remarks: reason.trim(),
      });
    });
  }

  static async getMovements(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { movementType, itemId, startDate, endDate } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (movementType) filter.movementType = movementType;
    if (itemId && mongoose.Types.ObjectId.isValid(itemId as string)) {
      filter.itemId = itemId;
    }
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const [data, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('itemId', 'name category unit sku')
        .populate('userId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryMovement.countDocuments(filter),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  private static async sendLowStockNotification(
    itemName: string,
    inventoryId: string,
    currentStock: number,
    threshold: number,
    session?: ClientSession,
  ) {
    const settingsQuery = Settings.findOne();
    if (session) settingsQuery.session(session);
    const settings = await settingsQuery;
    if (settings && !settings.notificationSettings.lowInventory) return;

    await Notification.create(
      [
        {
          type: NotificationType.LOW_INVENTORY,
          title: 'Low Inventory Alert',
          message: `${itemName} stock is at ${currentStock} (threshold: ${threshold})`,
          metadata: { inventoryId, itemName, currentStock, threshold },
        },
      ],
      session ? { session } : {},
    );
  }
}
