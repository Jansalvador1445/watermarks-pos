"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoiceOutstandingReport = exports.getInvoiceSummaryReport = void 0;
const invoiceReportService_1 = require("../services/invoiceReportService");
const InvoiceReportFiltersDTO_1 = require("../dtos/InvoiceReportFiltersDTO");
const response_1 = require("../utils/response");
exports.getInvoiceSummaryReport = (0, response_1.asyncHandler)(async (req, res) => {
    const filters = InvoiceReportFiltersDTO_1.InvoiceReportFiltersDTO.validate(req.query, 'invoice-summary');
    const data = await invoiceReportService_1.InvoiceReportService.getInvoiceSummaryReport(filters);
    return (0, response_1.successResponse)(res, data);
});
exports.getInvoiceOutstandingReport = (0, response_1.asyncHandler)(async (req, res) => {
    const filters = InvoiceReportFiltersDTO_1.InvoiceReportFiltersDTO.validate(req.query, 'outstanding');
    const data = await invoiceReportService_1.InvoiceReportService.getOutstandingReport(filters);
    return (0, response_1.successResponse)(res, data);
});
//# sourceMappingURL=invoiceReportController.js.map