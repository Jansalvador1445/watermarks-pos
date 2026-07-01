"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertWaterOrder = exports.deleteWaterOrder = exports.updateWaterOrder = exports.createWaterOrder = exports.getWaterOrder = exports.getWaterOrders = exports.convertInvoice = exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoice = exports.getInvoices = void 0;
const invoiceService_1 = require("../services/invoiceService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.getInvoices = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await invoiceService_1.InvoiceService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getInvoice = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await invoiceService_1.InvoiceService.getById((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.createInvoice = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await invoiceService_1.InvoiceService.create(req.body, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Invoice created', 201);
});
exports.updateInvoice = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await invoiceService_1.InvoiceService.update((0, params_1.getParamId)(req), req.body, req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Invoice updated');
});
exports.deleteInvoice = (0, response_1.asyncHandler)(async (req, res) => {
    await invoiceService_1.InvoiceService.delete((0, params_1.getParamId)(req), req.user.userId);
    return (0, response_1.successResponse)(res, null, 'Invoice deleted');
});
exports.convertInvoice = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await invoiceService_1.InvoiceService.convertToDelivery((0, params_1.getParamId)(req), req.user?.userId);
    return (0, response_1.successResponse)(res, data, 'Invoice converted to delivery');
});
/** @deprecated aliases */
exports.getWaterOrders = exports.getInvoices;
exports.getWaterOrder = exports.getInvoice;
exports.createWaterOrder = exports.createInvoice;
exports.updateWaterOrder = exports.updateInvoice;
exports.deleteWaterOrder = exports.deleteInvoice;
exports.convertWaterOrder = exports.convertInvoice;
//# sourceMappingURL=invoiceController.js.map