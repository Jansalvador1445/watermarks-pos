"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceReportFiltersDTO = void 0;
const enums_1 = require("../types/enums");
const response_1 = require("../utils/response");
const invoicePaymentStatus_1 = require("../utils/invoicePaymentStatus");
const VALID_STATUSES = ['paid', 'unpaid', 'partial', 'credit'];
const VALID_METHODS = Object.values(enums_1.PaymentMethod);
const MAX_RANGE_DAYS = 93;
function parseStatusParam(value) {
    if (value == null || value === '')
        return undefined;
    const raw = Array.isArray(value) ? value : String(value).split(',');
    const parsed = raw.map((s) => String(s).trim()).filter((s) => VALID_STATUSES.includes(s));
    return parsed.length ? parsed : undefined;
}
class InvoiceReportFiltersDTO {
    static validate(query, reportType) {
        const filters = {};
        const { startDate, endDate, customerId, paymentMethod, status } = query;
        if (startDate != null && startDate !== '') {
            const d = new Date(String(startDate));
            if (Number.isNaN(d.getTime())) {
                throw new response_1.AppError('Invalid startDate', 400);
            }
            filters.startDate = d.toISOString();
        }
        if (endDate != null && endDate !== '') {
            const d = new Date(String(endDate));
            if (Number.isNaN(d.getTime())) {
                throw new response_1.AppError('Invalid endDate', 400);
            }
            filters.endDate = d.toISOString();
        }
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            if (start > end) {
                throw new response_1.AppError('startDate must be before or equal to endDate', 400);
            }
            const diffDays = (end.getTime() - start.getTime()) / 86400000;
            if (diffDays > MAX_RANGE_DAYS) {
                throw new response_1.AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, 400);
            }
        }
        if (customerId != null && customerId !== '') {
            filters.customerId = String(customerId);
        }
        if (paymentMethod != null && paymentMethod !== '') {
            const method = String(paymentMethod);
            if (!VALID_METHODS.includes(method)) {
                throw new response_1.AppError('Invalid paymentMethod', 400);
            }
            filters.paymentMethod = method;
        }
        const parsedStatus = parseStatusParam(status);
        const allowed = (0, invoicePaymentStatus_1.getAllowedStatusesForReport)(reportType);
        if (parsedStatus?.length) {
            filters.status = parsedStatus.filter((s) => allowed.has(s));
            if (!filters.status.length) {
                throw new response_1.AppError('No valid status values for this report type', 400);
            }
        }
        else {
            filters.status = [...allowed];
        }
        return filters;
    }
}
exports.InvoiceReportFiltersDTO = InvoiceReportFiltersDTO;
//# sourceMappingURL=InvoiceReportFiltersDTO.js.map