"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_STATUSES_BY_REPORT = void 0;
exports.computePaymentStatus = computePaymentStatus;
exports.computeOutstandingBalance = computeOutstandingBalance;
exports.computeAgingBucket = computeAgingBucket;
exports.getAllowedStatusesForReport = getAllowedStatusesForReport;
function computePaymentStatus(invoiceTotal, totalPayments) {
    if (totalPayments === 0)
        return 'unpaid';
    if (totalPayments > invoiceTotal)
        return 'credit';
    if (totalPayments >= invoiceTotal)
        return 'paid';
    return 'partial';
}
function computeOutstandingBalance(invoiceTotal, totalPayments) {
    return Math.max(0, invoiceTotal - totalPayments);
}
function computeAgingBucket(invoiceDate, now = new Date()) {
    const daysPastDue = Math.max(0, Math.floor((now.getTime() - invoiceDate.getTime()) / 86400000));
    let bucket = '0-30';
    if (daysPastDue > 90)
        bucket = '90+';
    else if (daysPastDue > 60)
        bucket = '61-90';
    else if (daysPastDue > 30)
        bucket = '31-60';
    return { daysPastDue, bucket };
}
exports.ALLOWED_STATUSES_BY_REPORT = {
    'invoice-summary': ['unpaid', 'partial', 'paid', 'credit'],
    outstanding: ['unpaid', 'partial'],
};
function getAllowedStatusesForReport(reportType) {
    return new Set(exports.ALLOWED_STATUSES_BY_REPORT[reportType] ?? []);
}
//# sourceMappingURL=invoicePaymentStatus.js.map