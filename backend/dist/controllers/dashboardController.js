"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemSummary = exports.getRecentTransactions = exports.getRecentDeliveries = exports.getTopCustomers = exports.getActivity = exports.getInventory = exports.getDeliveries = exports.getSales = exports.getStats = void 0;
const dashboardService_1 = require("../services/dashboardService");
const response_1 = require("../utils/response");
exports.getStats = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await dashboardService_1.DashboardService.getStats();
    return (0, response_1.successResponse)(res, data);
});
exports.getSales = (0, response_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || 'daily';
    const range = req.query.range || 'this-month';
    const data = await dashboardService_1.DashboardService.getSales(period, range);
    return (0, response_1.successResponse)(res, data);
});
exports.getDeliveries = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await dashboardService_1.DashboardService.getDeliveriesOverview();
    return (0, response_1.successResponse)(res, data);
});
exports.getInventory = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await dashboardService_1.DashboardService.getInventoryOverview();
    return (0, response_1.successResponse)(res, data);
});
exports.getActivity = (0, response_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const data = await dashboardService_1.DashboardService.getActivityLogs(limit);
    return (0, response_1.successResponse)(res, data);
});
exports.getTopCustomers = (0, response_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const data = await dashboardService_1.DashboardService.getTopCustomers(limit);
    return (0, response_1.successResponse)(res, data);
});
exports.getRecentDeliveries = (0, response_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const data = await dashboardService_1.DashboardService.getRecentDeliveries(limit);
    return (0, response_1.successResponse)(res, data);
});
exports.getRecentTransactions = (0, response_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const data = await dashboardService_1.DashboardService.getRecentTransactions(limit);
    return (0, response_1.successResponse)(res, data);
});
exports.getSystemSummary = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await dashboardService_1.DashboardService.getSystemSummary();
    return (0, response_1.successResponse)(res, data);
});
//# sourceMappingURL=dashboardController.js.map