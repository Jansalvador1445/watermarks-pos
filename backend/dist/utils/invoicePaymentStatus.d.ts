export type InvoicePaymentStatus = 'paid' | 'unpaid' | 'partial' | 'credit';
export declare function computePaymentStatus(invoiceTotal: number, totalPayments: number): InvoicePaymentStatus;
export declare function computeOutstandingBalance(invoiceTotal: number, totalPayments: number): number;
export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';
export declare function computeAgingBucket(invoiceDate: Date, now?: Date): {
    daysPastDue: number;
    bucket: AgingBucket;
};
export declare const ALLOWED_STATUSES_BY_REPORT: Record<string, InvoicePaymentStatus[]>;
export declare function getAllowedStatusesForReport(reportType: string): Set<InvoicePaymentStatus>;
//# sourceMappingURL=invoicePaymentStatus.d.ts.map