import { Request } from 'express';
import mongoose from 'mongoose';
import { InvoiceStatus } from '../models/Invoice';
import { PaymentMethod } from '../types/enums';
export declare class InvoiceService {
    static getAll(req: Request): Promise<{
        data: {
            paymentSummary: {
                totalPaid: number;
                paymentCount: number;
                outstandingBalance: number;
                paymentStatus: import("../utils/invoicePaymentStatus").InvoicePaymentStatus;
            };
            invoiceNo: string;
            customerId: mongoose.Types.ObjectId;
            items: import("../models/Invoice").IInvoiceItem[];
            subtotal: number;
            tax: number;
            total: number;
            paymentMethod: PaymentMethod;
            notes?: string;
            status: InvoiceStatus;
            createdBy: mongoose.Types.ObjectId;
            deliveryId?: mongoose.Types.ObjectId;
            legacyWaterOrder?: boolean;
            isDeleted: boolean;
            deletedAt?: Date;
            createdAt: Date;
            updatedAt: Date;
            _id: mongoose.Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: mongoose.Collection;
            db: mongoose.Connection;
            errors?: mongoose.Error.ValidationError;
            isNew: boolean;
            schema: mongoose.Schema;
            __v: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    static getById(id: string): Promise<import("../models/Invoice").IInvoice & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static create(data: Record<string, unknown>, userId: string): Promise<mongoose.Document<unknown, {}, import("../models/Invoice").IInvoice, {}, mongoose.DefaultSchemaOptions> & import("../models/Invoice").IInvoice & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(id: string, data: Record<string, unknown>, userId: string): Promise<mongoose.Document<unknown, {}, import("../models/Invoice").IInvoice, {}, mongoose.DefaultSchemaOptions> & import("../models/Invoice").IInvoice & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static delete(id: string, userId: string): Promise<mongoose.Document<unknown, {}, import("../models/Invoice").IInvoice, {}, mongoose.DefaultSchemaOptions> & import("../models/Invoice").IInvoice & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static convertToDelivery(id: string, userId?: string): Promise<{
        invoice: (import("../models/Invoice").IInvoice & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
        delivery: mongoose.Document<unknown, {}, import("../models/Customer").IDelivery, {}, mongoose.DefaultSchemaOptions> & import("../models/Customer").IDelivery & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    private static toStockItems;
    private static enrichStockItems;
    private static resolveItems;
}
/** @deprecated Use InvoiceService */
export { InvoiceService as WaterOrderService };
//# sourceMappingURL=invoiceService.d.ts.map