import mongoose from 'mongoose';
import { InvoiceStatus } from '../models/Invoice';
import { PaymentMethod } from '../types/enums';
export interface PaymentTotals {
    total: number;
    count: number;
}
export declare class PaymentService {
    static getTotalsByInvoiceIds(invoiceIds: mongoose.Types.ObjectId[]): Promise<Map<string, PaymentTotals>>;
    static listByInvoice(invoiceId: string): Promise<{
        invoice: {
            _id: mongoose.Types.ObjectId;
            invoiceNo: string;
            total: number;
            status: InvoiceStatus.PENDING | InvoiceStatus.APPROVED | InvoiceStatus.CONVERTED;
        };
        payments: (import("../models/Payment").IPayment & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        summary: {
            totalPaid: number;
            paymentCount: number;
            outstandingBalance: number;
            paymentStatus: import("../utils/invoicePaymentStatus").InvoicePaymentStatus;
        };
    }>;
    static create(data: {
        invoiceId: string;
        amount: number;
        paymentMethod: PaymentMethod;
        paymentDate?: string | Date;
        notes?: string;
    }, userId: string): Promise<mongoose.PopulateDocumentResult<mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, mongoose.DefaultSchemaOptions> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("../models/Payment").IPayment, import("../models/Payment").IPayment>>;
    static delete(id: string): Promise<mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, mongoose.DefaultSchemaOptions> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private static syncDeliveryPaidState;
}
//# sourceMappingURL=paymentService.d.ts.map