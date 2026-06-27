"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDeliveryDecision = exports.getDeliveredHistory = exports.getCalendarEvents = exports.deleteDelivery = exports.updateDelivery = exports.createDelivery = exports.getDelivery = exports.getDeliveries = void 0;
const deliveryService_1 = require("../services/deliveryService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.getDeliveries = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await deliveryService_1.DeliveryService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getDelivery = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await deliveryService_1.DeliveryService.getById((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.createDelivery = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await deliveryService_1.DeliveryService.create(req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Delivery created', 201);
});
exports.updateDelivery = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await deliveryService_1.DeliveryService.update((0, params_1.getParamId)(req), req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Delivery updated');
});
exports.deleteDelivery = (0, response_1.asyncHandler)(async (req, res) => {
    await deliveryService_1.DeliveryService.delete((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, null, 'Delivery deleted');
});
exports.getCalendarEvents = (0, response_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await deliveryService_1.DeliveryService.getCalendarEvents(startDate, endDate);
    return (0, response_1.successResponse)(res, data);
});
exports.getDeliveredHistory = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await deliveryService_1.DeliveryService.getHistory(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.resolveDeliveryDecision = (0, response_1.asyncHandler)(async (req, res) => {
    const { action, rescheduleDate } = req.body;
    const data = await deliveryService_1.DeliveryService.resolveDecision((0, params_1.getParamId)(req), action, rescheduleDate);
    return (0, response_1.successResponse)(res, data, action === 'continue' ? 'Delivery will continue' : 'Delivery stopped');
});
//# sourceMappingURL=deliveryController.js.map