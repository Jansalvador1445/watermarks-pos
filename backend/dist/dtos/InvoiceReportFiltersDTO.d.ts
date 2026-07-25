import { PaymentMethod } from '../types/enums';
import { InvoicePaymentStatus } from '../utils/invoicePaymentStatus';
export interface InvoiceReportFilters {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    paymentMethod?: PaymentMethod;
    status?: InvoicePaymentStatus[];
}
export declare class InvoiceReportFiltersDTO {
    static validate(query: Record<string, unknown>, reportType: string): InvoiceReportFilters;
}
//# sourceMappingURL=InvoiceReportFiltersDTO.d.ts.map