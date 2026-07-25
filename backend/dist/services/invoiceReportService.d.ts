import { InvoiceReportFilters } from '../dtos/InvoiceReportFiltersDTO';
import { AgingBucket, InvoicePaymentStatus } from '../utils/invoicePaymentStatus';
export declare class InvoiceReportService {
    private static fetchEnrichedRows;
    private static buildCustomerBalances;
    static getInvoiceSummaryReport(filters: InvoiceReportFilters): Promise<{
        summary: {
            invoice: Record<string, unknown>;
            customer: {
                _id: unknown;
                fullName?: string;
                phone?: string;
            } | null;
            paymentStatus: InvoicePaymentStatus;
            totalPaid: number;
            outstandingBalance: number;
            paymentCount: number;
        }[];
        totals: {
            totalInvoices: number;
            totalInvoiceAmount: number;
            totalPaid: number;
            totalOutstanding: number;
            byStatus: Record<InvoicePaymentStatus, number>;
        };
        customerBalances: {
            customerId: string;
            customerName: string;
            totalOutstanding: number;
            invoiceCount: number;
        }[];
    }>;
    static getOutstandingReport(filters: InvoiceReportFilters): Promise<{
        outstanding: {
            invoice: Record<string, unknown>;
            customer: {
                _id: unknown;
                fullName?: string;
                phone?: string;
            } | null;
            totalAmount: unknown;
            paidAmount: number;
            outstandingAmount: number;
            paymentStatus: InvoicePaymentStatus;
            daysPastDue: number;
            agingBucket: AgingBucket;
        }[];
        summary: {
            totalOutstanding: number;
            count: number;
            bucketTotals: Record<AgingBucket, {
                count: number;
                total: number;
            }>;
        };
        customerBalances: {
            customerId: string;
            customerName: string;
            totalOutstanding: number;
            invoiceCount: number;
        }[];
    }>;
}
//# sourceMappingURL=invoiceReportService.d.ts.map