"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryMovements = exports.manualAdjust = exports.addProduction = exports.getInventoryReport = exports.getCustomerReport = exports.getDeliveryReport = exports.getSalesReport = exports.deleteInventoryItem = exports.updateInventoryItem = exports.createInventoryItem = exports.getInventoryItem = exports.getInventory = exports.getGallonHistory = exports.recordGallonTransaction = exports.recordGallonReturn = exports.recordGallonOut = exports.getGallonOverview = void 0;
const inventoryService_1 = require("../services/inventoryService");
const inventoryMovementService_1 = require("../services/inventoryMovementService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
const resolveInventory_1 = require("../utils/resolveInventory");
exports.getGallonOverview = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await inventoryService_1.GallonService.getOverview();
    return (0, response_1.successResponse)(res, data);
});
exports.recordGallonOut = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await inventoryService_1.GallonService.recordOut(req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Item recorded out', 201);
});
exports.recordGallonReturn = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await inventoryService_1.GallonService.recordReturn(req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Item recorded as returned', 201);
});
exports.recordGallonTransaction = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await inventoryService_1.GallonService.recordTransaction(req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Item transaction recorded', 201);
});
exports.getGallonHistory = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await inventoryService_1.GallonService.getHistory(req.query.itemKey);
    return (0, response_1.successResponse)(res, data);
});
exports.getInventory = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await inventoryService_1.InventoryService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getInventoryItem = (0, response_1.asyncHandler)(async (req, res) => {
    const id = await (0, resolveInventory_1.resolveInventoryId)((0, params_1.getParamId)(req));
    const data = await inventoryService_1.InventoryService.getById(id);
    return (0, response_1.successResponse)(res, data);
});
exports.createInventoryItem = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await inventoryService_1.InventoryService.create(req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Inventory item created', 201);
});
exports.updateInventoryItem = (0, response_1.asyncHandler)(async (req, res) => {
    const id = await (0, resolveInventory_1.resolveInventoryId)((0, params_1.getParamId)(req));
    const data = await inventoryService_1.InventoryService.update(id, req.body, req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Inventory item updated');
});
exports.deleteInventoryItem = (0, response_1.asyncHandler)(async (req, res) => {
    const id = await (0, resolveInventory_1.resolveInventoryId)((0, params_1.getParamId)(req));
    await inventoryService_1.InventoryService.delete(id);
    return (0, response_1.successResponse)(res, null, 'Inventory item deleted');
});
exports.getSalesReport = (0, response_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, groupBy } = req.query;
    const data = await inventoryService_1.ReportService.getSalesReport(startDate, endDate, groupBy);
    return (0, response_1.successResponse)(res, data);
});
exports.getDeliveryReport = (0, response_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await inventoryService_1.ReportService.getDeliveryReport(startDate, endDate);
    return (0, response_1.successResponse)(res, data);
});
exports.getCustomerReport = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await inventoryService_1.ReportService.getCustomerReport();
    return (0, response_1.successResponse)(res, data);
});
exports.getInventoryReport = (0, response_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await inventoryService_1.ReportService.getInventoryReport(startDate, endDate);
    return (0, response_1.successResponse)(res, data);
});
exports.addProduction = (0, response_1.asyncHandler)(async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const id = await (0, resolveInventory_1.resolveInventoryId)((0, params_1.getParamId)(req));
    const { quantity, remarks } = req.body;
    const data = await inventoryMovementService_1.InventoryMovementService.addProduction(id, quantity, remarks, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Production recorded', 201);
});
exports.manualAdjust = (0, response_1.asyncHandler)(async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const id = await (0, resolveInventory_1.resolveInventoryId)((0, params_1.getParamId)(req));
    const { quantity, reason } = req.body;
    const data = await inventoryMovementService_1.InventoryMovementService.manualAdjust(id, quantity, reason, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Adjustment recorded', 201);
});
exports.getInventoryMovements = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await inventoryMovementService_1.InventoryMovementService.getMovements(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
//# sourceMappingURL=inventoryController.js.map