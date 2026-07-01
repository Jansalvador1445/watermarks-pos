import { Request } from 'express';
import mongoose from 'mongoose';
export declare class InvoiceService {
    static getAll(req: Request): Promise<{
        data: (import("../models/Invoice").IInvoice & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
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