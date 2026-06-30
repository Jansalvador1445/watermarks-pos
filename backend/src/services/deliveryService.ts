import { Request } from 'express';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { Delivery } from '../models/Customer';
import { AppError } from '../utils/response';
import { getPagination, buildSearchQuery } from '../utils/pagination';
import { resolveDeliveryState } from '../utils/deliveryColor';
import { UserRole, DeliveryStatus } from '../types/enums';
import { AuthRequest } from '../types/express.d';
import { InventoryMovementService } from './inventoryMovementService';
import { resolveDocumentId } from '../utils/resolveDocumentId';
import { InventoryMovement } from '../models/InventoryMovement';
import { Log } from '../models/Notification';

type DeliveryRecord = {
  status: string;
  date: Date | string;
  colorCode?: string;
};

const INVENTORY_LOCKED_FIELDS = ['slimOut', 'roundOut', 'slimReturn', 'roundReturn', 'customerId'] as const;

export class DeliveryService {
  private static enrichDelivery<T extends DeliveryRecord>(delivery: T): T & { status: string; colorCode: string } {
    const resolved = resolveDeliveryState(delivery.status, delivery.date);
    return { ...delivery, status: resolved.status, colorCode: resolved.colorCode };
  }

  private static applyDeliveryRules(data: Record<string, unknown>) {
    const status = (data.status as string) || 'pending';
    const date = data.date as Date | string;

    if (status === 'delivered') {
      data.status = 'delivered';
      data.colorCode = 'white';
      return data;
    }

    const resolved = resolveDeliveryState(status, date);
    data.status = resolved.status;
    data.colorCode = resolved.colorCode;
    return data;
  }

  private static isDeliveredTransition(previousStatus: string, nextStatus: string): boolean {
    return previousStatus !== DeliveryStatus.DELIVERED && nextStatus === DeliveryStatus.DELIVERED;
  }

  private static assertNoLockedFieldChanges(
    existing: { inventoryProcessedAt?: Date; slimOut: number; roundOut: number; slimReturn: number; roundReturn: number; customerId: mongoose.Types.ObjectId },
    updateData: Record<string, unknown>,
  ) {
    if (!existing.inventoryProcessedAt) return;

    for (const field of INVENTORY_LOCKED_FIELDS) {
      if (updateData[field] === undefined) continue;
      const next = updateData[field];
      const current = existing[field];
      if (field === 'customerId') {
        if (String(next) !== String(current)) {
          throw new AppError('Cannot change customer after delivery inventory has been processed', 400);
        }
      } else if (next !== current) {
        throw new AppError('Cannot change gallon quantities after delivery is marked delivered', 400);
      }
    }
  }

  private static deliveryInventoryPayload(delivery: {
    referenceNo: string;
    customerId: mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId };
    slimOut: number;
    roundOut: number;
    slimReturn: number;
    roundReturn: number;
    sourceInvoiceId?: mongoose.Types.ObjectId;
  }) {
    return {
      referenceNo: delivery.referenceNo,
      customerId: new mongoose.Types.ObjectId(resolveDocumentId(delivery.customerId, 'customerId')),
      slimOut: delivery.slimOut,
      roundOut: delivery.roundOut,
      slimReturn: delivery.slimReturn,
      roundReturn: delivery.roundReturn,
      sourceInvoiceId: delivery.sourceInvoiceId,
    };
  }

  private static async markInventoryProcessed(
    deliveryId: string,
    session?: mongoose.ClientSession,
  ) {
    await Delivery.findOneAndUpdate(
      { _id: deliveryId, inventoryProcessedAt: { $exists: false } },
      { inventoryProcessedAt: new Date() },
      { session: session || undefined },
    );
  }

  private static deliveryHasGallonActivity(delivery: {
    slimOut: number;
    roundOut: number;
    slimReturn: number;
    roundReturn: number;
  }) {
    return (
      delivery.slimOut > 0 ||
      delivery.roundOut > 0 ||
      delivery.slimReturn > 0 ||
      delivery.roundReturn > 0
    );
  }

  /** Recover deliveries where inventory/outstanding processing did not complete. */
  private static async needsInventoryRecovery(
    delivery: {
      referenceNo: string;
      status: string;
      slimOut: number;
      roundOut: number;
      slimReturn: number;
      roundReturn: number;
    },
    session?: mongoose.ClientSession,
  ) {
    if (delivery.status !== DeliveryStatus.DELIVERED) return false;
    if (!this.deliveryHasGallonActivity(delivery)) return false;

    const movementQuery = InventoryMovement.countDocuments({
      referenceNo: delivery.referenceNo,
      isDeleted: false,
    });
    const logQuery = Log.findOne({
      module: 'customers',
      'metadata.referenceNo': delivery.referenceNo,
      'metadata.type': 'outstanding_update',
    });
    if (session) {
      movementQuery.session(session);
      logQuery.session(session);
    }

    const [movementCount, outstandingLog] = await Promise.all([movementQuery, logQuery]);
    if (outstandingLog && movementCount > 0) return false;
    return true;
  }

  private static async handleDeliveryCompleted(
    delivery: {
      referenceNo: string;
      customerId: mongoose.Types.ObjectId;
      slimOut: number;
      roundOut: number;
      slimReturn: number;
      roundReturn: number;
      sourceInvoiceId?: mongoose.Types.ObjectId;
    },
    userId: string,
    session?: mongoose.ClientSession,
  ) {
    await InventoryMovementService.processDeliveryCompleted(session, delivery, userId);
  }

  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { status, startDate, endDate, view, search } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;

    if (search && typeof search === 'string' && search.trim()) {
      const { Customer } = await import('../models/Customer');
      const customerFilter = buildSearchQuery(search, ['fullName', 'phone', 'address']);
      const matchingCustomers = await Customer.find({ isDeleted: false, ...customerFilter })
        .select('_id')
        .limit(50)
        .lean();
      const customerIds = matchingCustomers.map((c) => c._id);
      const deliverySearch = buildSearchQuery(search, ['schedule', 'remarks']);
      const orClauses: Record<string, unknown>[] = [];
      if (customerIds.length > 0) {
        orClauses.push({ customerId: { $in: customerIds } });
      }
      if (deliverySearch.$or) {
        orClauses.push(...(deliverySearch.$or as Record<string, unknown>[]));
      }
      if (orClauses.length > 0) {
        filter.$or = orClauses;
      }
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else if (view === 'daily') {
      filter.date = {
        $gte: dayjs().startOf('day').toDate(),
        $lte: dayjs().endOf('day').toDate(),
      };
    } else if (view === 'weekly') {
      filter.date = {
        $gte: dayjs().startOf('week').toDate(),
        $lte: dayjs().endOf('week').toDate(),
      };
    } else if (view === 'monthly') {
      filter.date = {
        $gte: dayjs().startOf('month').toDate(),
        $lte: dayjs().endOf('month').toDate(),
      };
    }

    const [data, total] = await Promise.all([
      Delivery.find(filter)
        .populate('customerId', 'fullName address phone pricingCategory')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments(filter),
    ]);

    return { data: data.map((d) => this.enrichDelivery(d)), pagination: { page, limit, total } };
  }

  static async getById(id: string) {
    const delivery = await Delivery.findOne({ _id: id, isDeleted: false }).populate(
      'customerId',
      'fullName address phone pricingCategory outstandingSlim outstandingRound',
    );
    if (!delivery) throw new AppError('Delivery not found', 404);
    return this.enrichDelivery(delivery.toObject());
  }

  static async create(data: Record<string, unknown>, userId?: string) {
    const payload = this.applyDeliveryRules({
      ...data,
      date: new Date(data.date as string),
      rescheduleDate: data.rescheduleDate ? new Date(data.rescheduleDate as string) : undefined,
    });

    if (userId && payload.status === DeliveryStatus.DELIVERED) {
      return InventoryMovementService.withTransaction(async (session) => {
        const [delivery] = await Delivery.create([payload], { session });
        await this.handleDeliveryCompleted(
          this.deliveryInventoryPayload(delivery),
          userId,
          session,
        );
        await this.markInventoryProcessed(delivery._id.toString(), session);
        delivery.inventoryProcessedAt = new Date();
        return this.enrichDelivery(delivery.toObject());
      });
    }

    const delivery = await Delivery.create(payload);
    return this.enrichDelivery(delivery.toObject());
  }

  static async update(id: string, data: Record<string, unknown>, userId?: string) {
    const updateData = { ...data };
    if (data.date) updateData.date = new Date(data.date as string);
    if (data.rescheduleDate) updateData.rescheduleDate = new Date(data.rescheduleDate as string);

    const existing = await Delivery.findOne({ _id: id, isDeleted: false });
    if (!existing) throw new AppError('Delivery not found', 404);

    if (
      userId &&
      existing.status === DeliveryStatus.DELIVERED &&
      (existing.slimOut > 0 || existing.roundOut > 0 || existing.slimReturn > 0 || existing.roundReturn > 0) &&
      (await this.needsInventoryRecovery(existing))
    ) {
      await InventoryMovementService.withTransaction(async (session) => {
        await this.handleDeliveryCompleted(this.deliveryInventoryPayload(existing), userId, session);
        await this.markInventoryProcessed(existing._id.toString(), session);
      });
    }

    this.assertNoLockedFieldChanges(existing, updateData);

    const merged = this.applyDeliveryRules({
      ...existing.toObject(),
      ...updateData,
    });

    const previousStatus = existing.status;
    const nextStatus = merged.status as string;

    if (userId && this.isDeliveredTransition(previousStatus, nextStatus)) {
      return InventoryMovementService.withTransaction(async (session) => {
        let delivery = await Delivery.findOneAndUpdate(
          { _id: id, isDeleted: false, inventoryProcessedAt: { $exists: false } },
          {
            ...updateData,
            status: merged.status,
            colorCode: merged.colorCode,
          },
          { new: true, runValidators: true, session },
        ).populate('customerId', 'fullName address phone');

        if (!delivery) {
          const current = await Delivery.findOne({ _id: id, isDeleted: false })
            .populate('customerId', 'fullName address phone')
            .session(session || null);
          if (!current) throw new AppError('Delivery not found', 404);

          if (current.inventoryProcessedAt) {
            if (await this.needsInventoryRecovery(current, session)) {
              await this.handleDeliveryCompleted(
                this.deliveryInventoryPayload(current),
                userId,
                session,
              );
            }
            const updated = await Delivery.findOneAndUpdate(
              { _id: id, isDeleted: false },
              { ...updateData, status: merged.status, colorCode: merged.colorCode },
              { new: true, runValidators: true, session },
            ).populate('customerId', 'fullName address phone');
            return this.enrichDelivery(updated!.toObject());
          }
          throw new AppError('Delivery not found', 404);
        }

        await this.handleDeliveryCompleted(
          this.deliveryInventoryPayload(delivery),
          userId,
          session,
        );
        await this.markInventoryProcessed(delivery._id.toString(), session);
        delivery.inventoryProcessedAt = new Date();

        return this.enrichDelivery(delivery.toObject());
      });
    }

    const delivery = await Delivery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        ...updateData,
        status: merged.status,
        colorCode: merged.colorCode,
      },
      { new: true, runValidators: true },
    ).populate('customerId', 'fullName address phone');

    if (!delivery) throw new AppError('Delivery not found', 404);
    return this.enrichDelivery(delivery.toObject());
  }

  static async delete(id: string) {
    const delivery = await Delivery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!delivery) throw new AppError('Delivery not found', 404);
    return delivery;
  }

  static async getCalendarEvents(startDate: string, endDate: string) {
    const data = await Delivery.find({
      isDeleted: false,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate('customerId', 'fullName address')
      .lean();

    return data.map((d) => this.enrichDelivery(d));
  }

  static async getHistory(req: AuthRequest) {
    const { page, limit, skip, sort } = getPagination(req);
    const { staffId, startDate, endDate } = req.query;
    const role = req.user?.role;

    const filter: Record<string, unknown> = {
      isDeleted: false,
      status: 'delivered',
    };

    if (role === UserRole.DELIVERY_STAFF) {
      filter.assignedStaffId = req.user!.userId;
    } else if (staffId) {
      filter.assignedStaffId = staffId;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const [data, total] = await Promise.all([
      Delivery.find(filter)
        .populate('customerId', 'fullName address phone')
        .populate('assignedStaffId', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments(filter),
    ]);

    return { data: data.map((d) => this.enrichDelivery(d)), pagination: { page, limit, total } };
  }

  static async resolveDecision(id: string, action: 'continue' | 'stop', rescheduleDate?: string) {
    const delivery = await Delivery.findOne({ _id: id, isDeleted: false });
    if (!delivery) throw new AppError('Delivery not found', 404);

    if (action === 'continue') {
      const newDate = rescheduleDate ? new Date(rescheduleDate) : new Date();
      delivery.date = newDate;
      delivery.rescheduleDate = newDate;
      delivery.continuationDecision = 'continued';
      const resolved = resolveDeliveryState('pending', newDate);
      delivery.status = resolved.status;
      delivery.colorCode = resolved.colorCode;
      delivery.remarks = delivery.remarks
        ? `${delivery.remarks} | Rescheduled to ${dayjs(newDate).format('MMM D, YYYY')}`
        : `Rescheduled to ${dayjs(newDate).format('MMM D, YYYY')}`;
    } else {
      delivery.continuationDecision = 'stopped';
      delivery.remarks = delivery.remarks
        ? `${delivery.remarks} | Delivery stopped — will not continue`
        : 'Delivery stopped — will not continue';
    }

    await delivery.save();

    const { DeliveryNotificationService } = await import('./deliveryNotificationService');
    await DeliveryNotificationService.markDeliveryNotificationsRead(id);

    const populated = await Delivery.findById(delivery._id).populate('customerId', 'fullName address phone');
    return this.enrichDelivery(populated!.toObject());
  }
}
