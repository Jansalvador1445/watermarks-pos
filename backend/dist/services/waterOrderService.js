"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterOrderService = void 0;
const WaterOrder_1 = require("../models/WaterOrder");
const Customer_1 = require("../models/Customer");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
class WaterOrderService {
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { status, search } = req.query;
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        const [data, total] = await Promise.all([
            WaterOrder_1.WaterOrder.find(filter)
                .populate('customerId', 'fullName phone address schedule')
                .populate('createdBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            WaterOrder_1.WaterOrder.countDocuments(filter),
        ]);
        let filtered = data;
        if (search && typeof search === 'string') {
            const regex = new RegExp(search.trim(), 'i');
            filtered = data.filter((order) => {
                const customer = order.customerId;
                return customer?.fullName?.match(regex) || customer?.phone?.match(regex);
            });
        }
        return { data: filtered, pagination: { page, limit, total: search ? filtered.length : total } };
    }
    static async getById(id) {
        const order = await WaterOrder_1.WaterOrder.findOne({ _id: id, isDeleted: false })
            .populate('customerId', 'fullName phone address schedule slimPrice roundPrice')
            .populate('createdBy', 'name email')
            .lean();
        if (!order)
            throw new response_1.AppError('Water order not found', 404);
        return order;
    }
    static async create(data, userId) {
        const customerId = String(data.customerId);
        const customer = await Customer_1.Customer.findOne({ _id: customerId, isDeleted: false });
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        return WaterOrder_1.WaterOrder.create({
            ...data,
            preferredDate: new Date(data.preferredDate),
            createdBy: userId,
            status: WaterOrder_1.WaterOrderStatus.PENDING,
        });
    }
    static async update(id, data) {
        const order = await WaterOrder_1.WaterOrder.findOne({ _id: id, isDeleted: false });
        if (!order)
            throw new response_1.AppError('Water order not found', 404);
        if (order.status === WaterOrder_1.WaterOrderStatus.CONVERTED) {
            throw new response_1.AppError('Cannot update a converted order', 400);
        }
        if (data.preferredDate)
            data.preferredDate = new Date(data.preferredDate);
        if (data.status && data.status === WaterOrder_1.WaterOrderStatus.CONVERTED) {
            throw new response_1.AppError('Use convert endpoint to mark as converted', 400);
        }
        const updated = await WaterOrder_1.WaterOrder.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true, runValidators: true })
            .populate('customerId', 'fullName phone address')
            .populate('createdBy', 'name email');
        return updated;
    }
    static async delete(id) {
        const order = await WaterOrder_1.WaterOrder.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!order)
            throw new response_1.AppError('Water order not found', 404);
        return order;
    }
    static async convertToDelivery(id, userId) {
        const order = await WaterOrder_1.WaterOrder.findOne({ _id: id, isDeleted: false }).populate('customerId', 'fullName schedule slimPrice roundPrice');
        if (!order)
            throw new response_1.AppError('Water order not found', 404);
        if (order.status === WaterOrder_1.WaterOrderStatus.CONVERTED) {
            throw new response_1.AppError('Order already converted', 400);
        }
        if (order.status === WaterOrder_1.WaterOrderStatus.REJECTED) {
            throw new response_1.AppError('Cannot convert a rejected order', 400);
        }
        const customer = order.customerId;
        const deliveryData = {
            customerId: customer._id,
            date: order.preferredDate,
            schedule: customer.schedule,
            status: 'pending',
            colorCode: 'white',
            paid: false,
            discount: 0,
            slimOut: order.gallonType === enums_1.GallonType.SLIM ? order.quantity : 0,
            roundOut: order.gallonType === enums_1.GallonType.ROUND ? order.quantity : 0,
            slimIn: 0,
            roundIn: 0,
            slimReturn: 0,
            roundReturn: 0,
            remarks: order.notes ? `From water order: ${order.notes}` : 'Converted from water order',
        };
        if (userId)
            deliveryData.assignedStaffId = userId;
        const delivery = await Customer_1.Delivery.create(deliveryData);
        order.status = WaterOrder_1.WaterOrderStatus.CONVERTED;
        order.deliveryId = delivery._id;
        await order.save();
        const populated = await WaterOrder_1.WaterOrder.findById(order._id)
            .populate('customerId', 'fullName phone address')
            .populate('createdBy', 'name email')
            .lean();
        return { order: populated, delivery };
    }
}
exports.WaterOrderService = WaterOrderService;
//# sourceMappingURL=waterOrderService.js.map