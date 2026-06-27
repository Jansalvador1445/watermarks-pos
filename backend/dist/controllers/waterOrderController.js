"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertWaterOrder = exports.deleteWaterOrder = exports.updateWaterOrder = exports.createWaterOrder = exports.getWaterOrder = exports.getWaterOrders = void 0;
const waterOrderService_1 = require("../services/waterOrderService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.getWaterOrders = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await waterOrderService_1.WaterOrderService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getWaterOrder = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await waterOrderService_1.WaterOrderService.getById((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.createWaterOrder = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await waterOrderService_1.WaterOrderService.create(req.body, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Water order created', 201);
});
exports.updateWaterOrder = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await waterOrderService_1.WaterOrderService.update((0, params_1.getParamId)(req), req.body);
    return (0, response_1.successResponse)(res, data, 'Water order updated');
});
exports.deleteWaterOrder = (0, response_1.asyncHandler)(async (req, res) => {
    await waterOrderService_1.WaterOrderService.delete((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, null, 'Water order deleted');
});
exports.convertWaterOrder = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await waterOrderService_1.WaterOrderService.convertToDelivery((0, params_1.getParamId)(req), req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Order converted to delivery');
});
//# sourceMappingURL=waterOrderController.js.map