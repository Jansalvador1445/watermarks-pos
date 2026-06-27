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
exports.InventoryMovementService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Gallon_1 = require("../models/Gallon");
const InventoryMovement_1 = require("../models/InventoryMovement");
const Customer_1 = require("../models/Customer");
const Notification_1 = require("../models/Notification");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
const secureReference_1 = require("../utils/secureReference");
const resolveDocumentId_1 = require("../utils/resolveDocumentId");
const isTransactionUnsupported = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    return (message.includes('Transaction numbers are only allowed') ||
        message.includes('replica set') ||
        message.includes('mongos') ||
        message.includes('retryable writes') ||
        message.includes('retryWrites=false'));
};
class InventoryMovementService {
    static async withTransaction(fn) {
        const session = await mongoose_1.default.startSession();
        try {
            let result;
            try {
                await session.withTransaction(async () => {
                    result = await fn(session);
                });
            }
            catch (error) {
                if (isTransactionUnsupported(error)) {
                    result = await fn(undefined);
                }
                else {
                    throw error;
                }
            }
            return result;
        }
        finally {
            await session.endSession();
        }
    }
    static async findInventoryByType(type, session) {
        const query = Gallon_1.Inventory.findOne({ refillType: type, isDeleted: false }).sort({ createdAt: 1 });
        if (session)
            query.session(session);
        const item = await query;
        if (!item)
            throw new response_1.AppError(`No inventory item linked for refill type: ${type}`, 404);
        return item;
    }
    static async findInventoryByProductLink(productId, session) {
        const { Product } = await Promise.resolve().then(() => __importStar(require('../models/Product')));
        const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session || null);
        if (!product)
            throw new response_1.AppError('Product not found', 404);
        if (product.linkedInventoryId) {
            const query = Gallon_1.Inventory.findOne({ _id: product.linkedInventoryId, isDeleted: false });
            if (session)
                query.session(session);
            const item = await query;
            if (!item)
                throw new response_1.AppError('Linked inventory item not found', 404);
            return item;
        }
        if (product.gallonType) {
            return this.findInventoryByType(product.gallonType, session);
        }
        throw new response_1.AppError(`Product "${product.name}" has no linked inventory for stock tracking`, 400);
    }
    static async movementExists(filter, session) {
        const query = InventoryMovement_1.InventoryMovement.findOne({ ...filter, isDeleted: false });
        if (session)
            query.session(session);
        return query.lean();
    }
    static async applyStockEvent(session, payload) {
        const { inventoryId, movementType, quantity, referenceNo, userId, remarks } = payload;
        const itemOid = new mongoose_1.default.Types.ObjectId(inventoryId);
        const existing = await this.movementExists({ referenceNo, itemId: itemOid, movementType }, session);
        if (existing) {
            const item = await Gallon_1.Inventory.findById(inventoryId);
            return {
                item,
                beforeStock: existing.beforeStock,
                afterStock: existing.afterStock,
                skipped: true,
            };
        }
        const decrease = quantity < 0 ? Math.abs(quantity) : 0;
        const filter = {
            _id: inventoryId,
            isDeleted: false,
        };
        if (quantity < 0) {
            filter.currentStock = { $gte: decrease };
        }
        const beforeDoc = await Gallon_1.Inventory.findOne(filter).session(session || null);
        if (!beforeDoc) {
            const check = await Gallon_1.Inventory.findOne({ _id: inventoryId, isDeleted: false }).session(session || null);
            if (!check)
                throw new response_1.AppError('Inventory item not found', 404);
            throw new response_1.AppError(`Insufficient stock for ${check.name}. Available: ${check.currentStock}, requested: ${decrease}`, 400);
        }
        const beforeStock = beforeDoc.currentStock;
        const item = await Gallon_1.Inventory.findOneAndUpdate(filter, { $inc: { currentStock: quantity } }, { new: true, session: session || undefined });
        if (!item) {
            throw new response_1.AppError('Insufficient stock for this operation', 400);
        }
        const afterStock = item.currentStock;
        await InventoryMovement_1.InventoryMovement.create([
            {
                date: new Date(),
                itemId: item._id,
                movementType,
                quantity,
                beforeStock,
                afterStock,
                referenceNo,
                userId: new mongoose_1.default.Types.ObjectId(userId),
                remarks,
            },
        ], session ? { session } : {});
        await Notification_1.Log.create([
            {
                userId: new mongoose_1.default.Types.ObjectId(userId),
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
        ], session ? { session } : {});
        if (afterStock <= item.lowStockThreshold) {
            await this.sendLowStockNotification(item.name, item._id.toString(), afterStock, item.lowStockThreshold, session);
        }
        return { item, beforeStock, afterStock };
    }
    static async recordReturnEvent(session, payload) {
        const { inventoryId, quantity, referenceNo, userId, remarks } = payload;
        if (quantity <= 0)
            return;
        const itemOid = new mongoose_1.default.Types.ObjectId(inventoryId);
        const existing = await this.movementExists({ referenceNo, itemId: itemOid, movementType: enums_1.InventoryMovementType.RETURN }, session);
        if (existing)
            return;
        const item = await Gallon_1.Inventory.findOne({ _id: inventoryId, isDeleted: false }).session(session || null);
        if (!item)
            throw new response_1.AppError('Inventory item not found', 404);
        const stock = item.currentStock;
        await InventoryMovement_1.InventoryMovement.create([
            {
                date: new Date(),
                itemId: item._id,
                movementType: enums_1.InventoryMovementType.RETURN,
                quantity,
                beforeStock: stock,
                afterStock: stock,
                referenceNo,
                userId: new mongoose_1.default.Types.ObjectId(userId),
                remarks,
            },
        ], session ? { session } : {});
        await Notification_1.Log.create([
            {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                action: `return: ${quantity} ${item.name} (no stock change)`,
                module: 'inventory',
                metadata: { inventoryId: item._id, quantity, referenceNo },
            },
        ], session ? { session } : {});
    }
    static async updateCustomerOutstanding(session, customerId, slimDelta, roundDelta, userId, referenceNo) {
        if (slimDelta === 0 && roundDelta === 0)
            return null;
        if (referenceNo) {
            const existingLog = await Notification_1.Log.findOne({
                module: 'customers',
                'metadata.referenceNo': referenceNo,
                'metadata.type': 'outstanding_update',
            }).session(session || null);
            if (existingLog)
                return null;
        }
        const customer = await Customer_1.Customer.findOne({ _id: customerId, isDeleted: false }).session(session || null);
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        const previousSlim = customer.outstandingSlim ?? 0;
        const previousRound = customer.outstandingRound ?? 0;
        const newSlim = previousSlim + slimDelta;
        const newRound = previousRound + roundDelta;
        if (newSlim < 0 || newRound < 0) {
            throw new response_1.AppError('Customer outstanding gallons cannot be negative', 400);
        }
        customer.outstandingSlim = newSlim;
        customer.outstandingRound = newRound;
        await customer.save(session ? { session } : undefined);
        await Notification_1.Log.create([
            {
                userId: new mongoose_1.default.Types.ObjectId(userId),
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
        ], session ? { session } : {});
        return customer;
    }
    static async processDeliveryCompleted(session, delivery, userId) {
        const referenceNo = delivery.referenceNo;
        if (delivery.slimOut > 0) {
            const slimInventory = await this.findInventoryByType(enums_1.GallonType.SLIM, session);
            await this.applyStockEvent(session, {
                inventoryId: slimInventory._id.toString(),
                movementType: enums_1.InventoryMovementType.DELIVERY,
                quantity: -delivery.slimOut,
                referenceNo,
                userId,
                remarks: `Delivery completed — ${delivery.slimOut} slim gallon(s) out`,
            });
        }
        if (delivery.roundOut > 0) {
            const roundInventory = await this.findInventoryByType(enums_1.GallonType.ROUND, session);
            await this.applyStockEvent(session, {
                inventoryId: roundInventory._id.toString(),
                movementType: enums_1.InventoryMovementType.DELIVERY,
                quantity: -delivery.roundOut,
                referenceNo,
                userId,
                remarks: `Delivery completed — ${delivery.roundOut} round gallon(s) out`,
            });
        }
        if (delivery.slimReturn > 0) {
            const slimInventory = await this.findInventoryByType(enums_1.GallonType.SLIM, session);
            await this.recordReturnEvent(session, {
                inventoryId: slimInventory._id.toString(),
                quantity: delivery.slimReturn,
                referenceNo,
                userId,
                remarks: `Customer returned ${delivery.slimReturn} slim gallon(s)`,
            });
        }
        if (delivery.roundReturn > 0) {
            const roundInventory = await this.findInventoryByType(enums_1.GallonType.ROUND, session);
            await this.recordReturnEvent(session, {
                inventoryId: roundInventory._id.toString(),
                quantity: delivery.roundReturn,
                referenceNo,
                userId,
                remarks: `Customer returned ${delivery.roundReturn} round gallon(s)`,
            });
        }
        await this.updateCustomerOutstanding(session, (0, resolveDocumentId_1.resolveDocumentId)(delivery.customerId, 'customerId'), delivery.slimOut - delivery.slimReturn, delivery.roundOut - delivery.roundReturn, userId, referenceNo);
    }
    static async processTransactionStock(session, transaction, userId) {
        const movementType = transaction.type === enums_1.TransactionType.POS
            ? enums_1.InventoryMovementType.POS_SALE
            : transaction.type === enums_1.TransactionType.WALKIN
                ? enums_1.InventoryMovementType.WALKIN_SALE
                : null;
        if (!movementType)
            return;
        for (const item of transaction.items) {
            if (!item.decrementsStock)
                continue;
            let inventory;
            if (item.productId) {
                inventory = await this.findInventoryByProductLink(item.productId, session);
            }
            else if (item.gallonType &&
                (item.gallonType === enums_1.GallonType.SLIM || item.gallonType === enums_1.GallonType.ROUND)) {
                inventory = await this.findInventoryByType(item.gallonType, session);
            }
            else {
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
    static async reverseTransactionStock(session, transaction, userId) {
        const referenceNo = `REV-${transaction.invoiceNo}`;
        for (const item of transaction.items) {
            if (!item.decrementsStock)
                continue;
            let inventory;
            if (item.productId) {
                inventory = await this.findInventoryByProductLink(item.productId, session);
            }
            else if (item.gallonType &&
                (item.gallonType === enums_1.GallonType.SLIM || item.gallonType === enums_1.GallonType.ROUND)) {
                inventory = await this.findInventoryByType(item.gallonType, session);
            }
            else {
                continue;
            }
            await this.applyStockEvent(session, {
                inventoryId: inventory._id.toString(),
                movementType: enums_1.InventoryMovementType.ADJUSTMENT,
                quantity: item.quantity,
                referenceNo,
                userId,
                remarks: `Reversal of sale ${transaction.invoiceNo} — ${item.name} x${item.quantity}`,
            });
        }
    }
    static async addProduction(inventoryId, quantity, remarks, userId) {
        if (quantity <= 0)
            throw new response_1.AppError('Production quantity must be greater than 0', 400);
        return this.withTransaction(async (session) => {
            const referenceNo = (0, secureReference_1.generateSecureReference)('PROD');
            return this.applyStockEvent(session, {
                inventoryId,
                movementType: enums_1.InventoryMovementType.PRODUCTION,
                quantity,
                referenceNo,
                userId,
                remarks,
            });
        });
    }
    static async manualAdjust(inventoryId, quantity, reason, userId) {
        if (quantity === 0)
            throw new response_1.AppError('Adjustment quantity cannot be zero', 400);
        if (!reason?.trim())
            throw new response_1.AppError('Adjustment reason is required', 400);
        return this.withTransaction(async (session) => {
            const referenceNo = (0, secureReference_1.generateSecureReference)('ADJ');
            return this.applyStockEvent(session, {
                inventoryId,
                movementType: enums_1.InventoryMovementType.ADJUSTMENT,
                quantity,
                referenceNo,
                userId,
                remarks: reason.trim(),
            });
        });
    }
    static async getMovements(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { movementType, itemId, startDate, endDate } = req.query;
        const filter = { isDeleted: false };
        if (movementType)
            filter.movementType = movementType;
        if (itemId && mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            filter.itemId = itemId;
        }
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const [data, total] = await Promise.all([
            InventoryMovement_1.InventoryMovement.find(filter)
                .populate('itemId', 'name category unit sku')
                .populate('userId', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            InventoryMovement_1.InventoryMovement.countDocuments(filter),
        ]);
        return { data, pagination: { page, limit, total } };
    }
    static async sendLowStockNotification(itemName, inventoryId, currentStock, threshold, session) {
        const settingsQuery = Notification_1.Settings.findOne();
        if (session)
            settingsQuery.session(session);
        const settings = await settingsQuery;
        if (settings && !settings.notificationSettings.lowInventory)
            return;
        await Notification_1.Notification.create([
            {
                type: enums_1.NotificationType.LOW_INVENTORY,
                title: 'Low Inventory Alert',
                message: `${itemName} stock is at ${currentStock} (threshold: ${threshold})`,
                metadata: { inventoryId, itemName, currentStock, threshold },
            },
        ], session ? { session } : {});
    }
}
exports.InventoryMovementService = InventoryMovementService;
//# sourceMappingURL=inventoryMovementService.js.map