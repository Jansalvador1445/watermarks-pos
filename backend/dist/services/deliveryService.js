"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const Customer_1 = require("../models/Customer");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const deliveryColor_1 = require("../utils/deliveryColor");
const enums_1 = require("../types/enums");
const inventoryMovementService_1 = require("./inventoryMovementService");
const resolveDocumentId_1 = require("../utils/resolveDocumentId");
const InventoryMovement_1 = require("../models/InventoryMovement");
const Notification_1 = require("../models/Notification");
const INVENTORY_LOCKED_FIELDS = ['slimOut', 'roundOut', 'slimReturn', 'roundReturn', 'customerId'];
class DeliveryService {
    static enrichDelivery(delivery) {
        const resolved = (0, deliveryColor_1.resolveDeliveryState)(delivery.status, delivery.date);
        return { ...delivery, status: resolved.status, colorCode: resolved.colorCode };
    }
    static applyDeliveryRules(data) {
        const status = data.status || 'pending';
        const date = data.date;
        if (status === 'delivered') {
            data.status = 'delivered';
            data.colorCode = 'white';
            return data;
        }
        const resolved = (0, deliveryColor_1.resolveDeliveryState)(status, date);
        data.status = resolved.status;
        data.colorCode = resolved.colorCode;
        return data;
    }
    static isDeliveredTransition(previousStatus, nextStatus) {
        return previousStatus !== enums_1.DeliveryStatus.DELIVERED && nextStatus === enums_1.DeliveryStatus.DELIVERED;
    }
    static assertNoLockedFieldChanges(existing, updateData) {
        if (!existing.inventoryProcessedAt)
            return;
        for (const field of INVENTORY_LOCKED_FIELDS) {
            if (updateData[field] === undefined)
                continue;
            const next = updateData[field];
            const current = existing[field];
            if (field === 'customerId') {
                if (String(next) !== String(current)) {
                    throw new response_1.AppError('Cannot change customer after delivery inventory has been processed', 400);
                }
            }
            else if (next !== current) {
                throw new response_1.AppError('Cannot change gallon quantities after delivery is marked delivered', 400);
            }
        }
    }
    static deliveryInventoryPayload(delivery) {
        return {
            referenceNo: delivery.referenceNo,
            customerId: new mongoose_1.default.Types.ObjectId((0, resolveDocumentId_1.resolveDocumentId)(delivery.customerId, 'customerId')),
            slimOut: delivery.slimOut,
            roundOut: delivery.roundOut,
            slimReturn: delivery.slimReturn,
            roundReturn: delivery.roundReturn,
        };
    }
    static async markInventoryProcessed(deliveryId, session) {
        await Customer_1.Delivery.findOneAndUpdate({ _id: deliveryId, inventoryProcessedAt: { $exists: false } }, { inventoryProcessedAt: new Date() }, { session: session || undefined });
    }
    static deliveryHasGallonActivity(delivery) {
        return (delivery.slimOut > 0 ||
            delivery.roundOut > 0 ||
            delivery.slimReturn > 0 ||
            delivery.roundReturn > 0);
    }
    /** Recover deliveries where inventory/outstanding processing did not complete. */
    static async needsInventoryRecovery(delivery, session) {
        if (delivery.status !== enums_1.DeliveryStatus.DELIVERED)
            return false;
        if (!this.deliveryHasGallonActivity(delivery))
            return false;
        const movementQuery = InventoryMovement_1.InventoryMovement.countDocuments({
            referenceNo: delivery.referenceNo,
            isDeleted: false,
        });
        const logQuery = Notification_1.Log.findOne({
            module: 'customers',
            'metadata.referenceNo': delivery.referenceNo,
            'metadata.type': 'outstanding_update',
        });
        if (session) {
            movementQuery.session(session);
            logQuery.session(session);
        }
        const [movementCount, outstandingLog] = await Promise.all([movementQuery, logQuery]);
        if (outstandingLog && movementCount > 0)
            return false;
        return true;
    }
    static async handleDeliveryCompleted(delivery, userId, session) {
        await inventoryMovementService_1.InventoryMovementService.processDeliveryCompleted(session, delivery, userId);
    }
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { status, startDate, endDate, view, search } = req.query;
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        if (search && typeof search === 'string' && search.trim()) {
            const { Customer } = await Promise.resolve().then(() => __importStar(require('../models/Customer')));
            const customerFilter = (0, pagination_1.buildSearchQuery)(search, ['fullName', 'phone', 'address']);
            const matchingCustomers = await Customer.find({ isDeleted: false, ...customerFilter })
                .select('_id')
                .limit(50)
                .lean();
            const customerIds = matchingCustomers.map((c) => c._id);
            const deliverySearch = (0, pagination_1.buildSearchQuery)(search, ['schedule', 'remarks']);
            const orClauses = [];
            if (customerIds.length > 0) {
                orClauses.push({ customerId: { $in: customerIds } });
            }
            if (deliverySearch.$or) {
                orClauses.push(...deliverySearch.$or);
            }
            if (orClauses.length > 0) {
                filter.$or = orClauses;
            }
        }
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        else if (view === 'daily') {
            filter.date = {
                $gte: (0, dayjs_1.default)().startOf('day').toDate(),
                $lte: (0, dayjs_1.default)().endOf('day').toDate(),
            };
        }
        else if (view === 'weekly') {
            filter.date = {
                $gte: (0, dayjs_1.default)().startOf('week').toDate(),
                $lte: (0, dayjs_1.default)().endOf('week').toDate(),
            };
        }
        else if (view === 'monthly') {
            filter.date = {
                $gte: (0, dayjs_1.default)().startOf('month').toDate(),
                $lte: (0, dayjs_1.default)().endOf('month').toDate(),
            };
        }
        const [data, total] = await Promise.all([
            Customer_1.Delivery.find(filter)
                .populate('customerId', 'fullName address phone pricingCategory')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Customer_1.Delivery.countDocuments(filter),
        ]);
        return { data: data.map((d) => this.enrichDelivery(d)), pagination: { page, limit, total } };
    }
    static async getById(id) {
        const delivery = await Customer_1.Delivery.findOne({ _id: id, isDeleted: false }).populate('customerId', 'fullName address phone pricingCategory outstandingSlim outstandingRound');
        if (!delivery)
            throw new response_1.AppError('Delivery not found', 404);
        return this.enrichDelivery(delivery.toObject());
    }
    static async create(data, userId) {
        const payload = this.applyDeliveryRules({
            ...data,
            date: new Date(data.date),
            rescheduleDate: data.rescheduleDate ? new Date(data.rescheduleDate) : undefined,
        });
        if (userId && payload.status === enums_1.DeliveryStatus.DELIVERED) {
            return inventoryMovementService_1.InventoryMovementService.withTransaction(async (session) => {
                const [delivery] = await Customer_1.Delivery.create([payload], { session });
                await this.handleDeliveryCompleted(this.deliveryInventoryPayload(delivery), userId, session);
                await this.markInventoryProcessed(delivery._id.toString(), session);
                delivery.inventoryProcessedAt = new Date();
                return this.enrichDelivery(delivery.toObject());
            });
        }
        const delivery = await Customer_1.Delivery.create(payload);
        return this.enrichDelivery(delivery.toObject());
    }
    static async update(id, data, userId) {
        const updateData = { ...data };
        if (data.date)
            updateData.date = new Date(data.date);
        if (data.rescheduleDate)
            updateData.rescheduleDate = new Date(data.rescheduleDate);
        const existing = await Customer_1.Delivery.findOne({ _id: id, isDeleted: false });
        if (!existing)
            throw new response_1.AppError('Delivery not found', 404);
        if (userId &&
            existing.status === enums_1.DeliveryStatus.DELIVERED &&
            (existing.slimOut > 0 || existing.roundOut > 0 || existing.slimReturn > 0 || existing.roundReturn > 0) &&
            (await this.needsInventoryRecovery(existing))) {
            await inventoryMovementService_1.InventoryMovementService.withTransaction(async (session) => {
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
        const nextStatus = merged.status;
        if (userId && this.isDeliveredTransition(previousStatus, nextStatus)) {
            return inventoryMovementService_1.InventoryMovementService.withTransaction(async (session) => {
                let delivery = await Customer_1.Delivery.findOneAndUpdate({ _id: id, isDeleted: false, inventoryProcessedAt: { $exists: false } }, {
                    ...updateData,
                    status: merged.status,
                    colorCode: merged.colorCode,
                }, { new: true, runValidators: true, session }).populate('customerId', 'fullName address phone');
                if (!delivery) {
                    const current = await Customer_1.Delivery.findOne({ _id: id, isDeleted: false })
                        .populate('customerId', 'fullName address phone')
                        .session(session || null);
                    if (!current)
                        throw new response_1.AppError('Delivery not found', 404);
                    if (current.inventoryProcessedAt) {
                        if (await this.needsInventoryRecovery(current, session)) {
                            await this.handleDeliveryCompleted(this.deliveryInventoryPayload(current), userId, session);
                        }
                        const updated = await Customer_1.Delivery.findOneAndUpdate({ _id: id, isDeleted: false }, { ...updateData, status: merged.status, colorCode: merged.colorCode }, { new: true, runValidators: true, session }).populate('customerId', 'fullName address phone');
                        return this.enrichDelivery(updated.toObject());
                    }
                    throw new response_1.AppError('Delivery not found', 404);
                }
                await this.handleDeliveryCompleted(this.deliveryInventoryPayload(delivery), userId, session);
                await this.markInventoryProcessed(delivery._id.toString(), session);
                delivery.inventoryProcessedAt = new Date();
                return this.enrichDelivery(delivery.toObject());
            });
        }
        const delivery = await Customer_1.Delivery.findOneAndUpdate({ _id: id, isDeleted: false }, {
            ...updateData,
            status: merged.status,
            colorCode: merged.colorCode,
        }, { new: true, runValidators: true }).populate('customerId', 'fullName address phone');
        if (!delivery)
            throw new response_1.AppError('Delivery not found', 404);
        return this.enrichDelivery(delivery.toObject());
    }
    static async delete(id) {
        const delivery = await Customer_1.Delivery.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!delivery)
            throw new response_1.AppError('Delivery not found', 404);
        return delivery;
    }
    static async getCalendarEvents(startDate, endDate) {
        const data = await Customer_1.Delivery.find({
            isDeleted: false,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
            .populate('customerId', 'fullName address')
            .lean();
        return data.map((d) => this.enrichDelivery(d));
    }
    static async getHistory(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { staffId, startDate, endDate } = req.query;
        const role = req.user?.role;
        const filter = {
            isDeleted: false,
            status: 'delivered',
        };
        if (role === enums_1.UserRole.DELIVERY_STAFF) {
            filter.assignedStaffId = req.user.userId;
        }
        else if (staffId) {
            filter.assignedStaffId = staffId;
        }
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const [data, total] = await Promise.all([
            Customer_1.Delivery.find(filter)
                .populate('customerId', 'fullName address phone')
                .populate('assignedStaffId', 'name email role')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Customer_1.Delivery.countDocuments(filter),
        ]);
        return { data: data.map((d) => this.enrichDelivery(d)), pagination: { page, limit, total } };
    }
    static async resolveDecision(id, action, rescheduleDate) {
        const delivery = await Customer_1.Delivery.findOne({ _id: id, isDeleted: false });
        if (!delivery)
            throw new response_1.AppError('Delivery not found', 404);
        if (action === 'continue') {
            const newDate = rescheduleDate ? new Date(rescheduleDate) : new Date();
            delivery.date = newDate;
            delivery.rescheduleDate = newDate;
            delivery.continuationDecision = 'continued';
            const resolved = (0, deliveryColor_1.resolveDeliveryState)('pending', newDate);
            delivery.status = resolved.status;
            delivery.colorCode = resolved.colorCode;
            delivery.remarks = delivery.remarks
                ? `${delivery.remarks} | Rescheduled to ${(0, dayjs_1.default)(newDate).format('MMM D, YYYY')}`
                : `Rescheduled to ${(0, dayjs_1.default)(newDate).format('MMM D, YYYY')}`;
        }
        else {
            delivery.continuationDecision = 'stopped';
            delivery.remarks = delivery.remarks
                ? `${delivery.remarks} | Delivery stopped — will not continue`
                : 'Delivery stopped — will not continue';
        }
        await delivery.save();
        const { DeliveryNotificationService } = await Promise.resolve().then(() => __importStar(require('./deliveryNotificationService')));
        await DeliveryNotificationService.markDeliveryNotificationsRead(id);
        const populated = await Customer_1.Delivery.findById(delivery._id).populate('customerId', 'fullName address phone');
        return this.enrichDelivery(populated.toObject());
    }
}
exports.DeliveryService = DeliveryService;
//# sourceMappingURL=deliveryService.js.map