"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = exports.InventoryService = exports.GallonService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dayjs_1 = __importDefault(require("dayjs"));
const Gallon_1 = require("../models/Gallon");
const Transaction_1 = require("../models/Transaction");
const Customer_1 = require("../models/Customer");
const InventoryMovement_1 = require("../models/InventoryMovement");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
const itemKey_1 = require("../utils/itemKey");
const inventoryMovementService_1 = require("./inventoryMovementService");
class GallonService {
    static resolveItemKey(data) {
        const rawKey = data.itemKey?.trim().toLowerCase();
        if (rawKey)
            return rawKey;
        if (data.type)
            return data.type;
        if (data.label?.trim())
            return (0, itemKey_1.slugifyItemKey)(data.label);
        throw new response_1.AppError('Item is required', 400);
    }
    static resolveLabel(data, itemKey) {
        if (data.label?.trim())
            return data.label.trim();
        if (data.type === enums_1.GallonType.SLIM)
            return 'Slim Container';
        if (data.type === enums_1.GallonType.ROUND)
            return 'Round Container';
        return (0, itemKey_1.defaultLabelFromKey)(itemKey);
    }
    static async findOrCreateGallon(data) {
        const itemKey = this.resolveItemKey(data);
        const label = this.resolveLabel(data, itemKey);
        let gallon = await Gallon_1.Gallon.findOne({ itemKey, isDeleted: false }).sort({ createdAt: 1 });
        if (!gallon) {
            gallon = await Gallon_1.Gallon.create({
                itemKey,
                label,
                type: data.type,
                currentIn: 0,
                currentOut: 0,
                returned: 0,
            });
        }
        else if (data.label?.trim() && gallon.label !== data.label.trim()) {
            gallon.label = data.label.trim();
            await gallon.save();
        }
        return gallon;
    }
    static async getOverview() {
        const gallons = await Gallon_1.Gallon.find({ isDeleted: false }).sort({ label: 1 }).lean();
        const items = gallons.map((g) => ({
            itemKey: g.itemKey,
            label: g.label,
            type: g.type,
            currentIn: g.currentIn,
            currentOut: g.currentOut,
            returned: g.returned,
        }));
        const findLegacy = (key, legacyType) => items.find((i) => i.itemKey === key || i.type === legacyType) ?? {
            itemKey: key,
            label: key === 'slim' ? 'Slim Container' : 'Round Container',
            type: legacyType,
            currentIn: 0,
            currentOut: 0,
            returned: 0,
        };
        return {
            items,
            slim: findLegacy('slim', enums_1.GallonType.SLIM),
            round: findLegacy('round', enums_1.GallonType.ROUND),
        };
    }
    static async recordOut(data, userId) {
        return this.recordDirection('out', data, userId);
    }
    static async recordReturn(data, userId) {
        return this.recordDirection('return', data, userId);
    }
    static async recordDirection(direction, data, userId) {
        const gallon = await this.findOrCreateGallon(data);
        const historyEntry = {
            direction,
            quantity: data.quantity,
            date: new Date(),
            userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
            remarks: data.remarks,
        };
        if (direction === 'out') {
            gallon.currentOut += data.quantity;
        }
        else {
            if (data.quantity > gallon.currentOut) {
                throw new response_1.AppError(`Cannot return more than containers currently out (${gallon.currentOut})`, 400);
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
    static async recordTransaction(data, userId) {
        if (data.action === 'out')
            return this.recordOut({ type: data.type, quantity: data.quantity, remarks: data.remarks }, userId);
        if (data.action === 'return')
            return this.recordReturn({ type: data.type, quantity: data.quantity, remarks: data.remarks }, userId);
        if (data.action === 'in') {
            throw new response_1.AppError('Water production must be recorded via Inventory → Production. This page tracks container flow (out/return) only.', 400);
        }
        throw new response_1.AppError('Invalid direction', 400);
    }
    static async getHistory(itemKey) {
        const filter = { isDeleted: false };
        if (itemKey)
            filter.itemKey = itemKey.toLowerCase();
        const gallons = await Gallon_1.Gallon.find(filter).sort({ label: 1 }).lean();
        return gallons
            .flatMap((g) => (g.history || []).map((h, index) => ({
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
        })))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 100);
    }
}
exports.GallonService = GallonService;
class InventoryService {
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { search, category } = req.query;
        const filter = { isDeleted: false };
        if (category)
            filter.category = category;
        Object.assign(filter, (0, pagination_1.buildSearchQuery)(search, ['name', 'sku', 'category']));
        const [data, total] = await Promise.all([
            Gallon_1.Inventory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            Gallon_1.Inventory.countDocuments(filter),
        ]);
        return { data, pagination: { page, limit, total } };
    }
    static async getById(id) {
        const item = await Gallon_1.Inventory.findOne({ _id: id, isDeleted: false });
        if (!item)
            throw new response_1.AppError('Inventory item not found', 404);
        return item;
    }
    static async create(data, userId) {
        const { initialQuantity, ...rest } = data;
        const qty = Math.max(0, Number(initialQuantity) || 0);
        const item = await Gallon_1.Inventory.create({ ...rest, currentStock: 0 });
        if (qty > 0) {
            if (!userId) {
                throw new response_1.AppError('Initial quantity requires an authenticated user', 400);
            }
            await inventoryMovementService_1.InventoryMovementService.addProduction(item._id.toString(), qty, 'Initial stock on item creation', userId);
        }
        return Gallon_1.Inventory.findById(item._id);
    }
    static async update(id, data, _userId) {
        const item = await Gallon_1.Inventory.findOne({ _id: id, isDeleted: false });
        if (!item)
            throw new response_1.AppError('Inventory item not found', 404);
        const { currentStock, initialQuantity, ...safeData } = data;
        if (currentStock !== undefined || initialQuantity !== undefined) {
            throw new response_1.AppError('Direct stock editing is not allowed. Use production or adjustment endpoints.', 400);
        }
        Object.assign(item, safeData);
        await item.save();
        return item;
    }
    static async delete(id) {
        const item = await Gallon_1.Inventory.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!item)
            throw new response_1.AppError('Inventory item not found', 404);
        return item;
    }
}
exports.InventoryService = InventoryService;
class ReportService {
    static async getSalesReport(startDate, endDate) {
        return Transaction_1.Transaction.aggregate([
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
    static async getDeliveryReport(startDate, endDate) {
        return Customer_1.Delivery.aggregate([
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
            Customer_1.Customer.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Customer_1.Customer.aggregate([
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
    static async getInventoryReport(startDate, endDate) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.$gte = new Date(startDate);
            dateFilter.$lte = new Date(endDate);
        }
        else {
            dateFilter.$gte = (0, dayjs_1.default)().startOf('month').toDate();
            dateFilter.$lte = (0, dayjs_1.default)().endOf('month').toDate();
        }
        const [items, movementSummary, recentMovements] = await Promise.all([
            Gallon_1.Inventory.find({ isDeleted: false }).lean(),
            InventoryMovement_1.InventoryMovement.aggregate([
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
            InventoryMovement_1.InventoryMovement.find({ isDeleted: false, date: dateFilter })
                .populate('itemId', 'name category unit')
                .populate('userId', 'name')
                .sort({ date: -1 })
                .limit(50)
                .lean(),
        ]);
        return { items, movementSummary, recentMovements, period: { startDate: dateFilter.$gte, endDate: dateFilter.$lte } };
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=inventoryService.js.map