import mongoose, { Document, Types } from 'mongoose';
import { PaymentMethod } from '../types/enums';
export declare enum InvoiceStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CONVERTED = "converted"
}
export interface IInvoiceItem {
    productId?: Types.ObjectId;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
}
export interface IInvoice extends Document {
    invoiceNo: string;
    customerId: Types.ObjectId;
    items: IInvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    status: InvoiceStatus;
    createdBy: Types.ObjectId;
    deliveryId?: Types.ObjectId;
    legacyWaterOrder?: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Invoice: mongoose.Model<IInvoice, {}, {}, {}, mongoose.Document<unknown, {}, IInvoice, {}, mongoose.DefaultSchemaOptions> & IInvoice & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInvoice>;
/** @deprecated Use Invoice — kept for migration compatibility */
export { Invoice as WaterOrder, InvoiceStatus as WaterOrderStatus };
export type IWaterOrder = IInvoice;
//# sourceMappingURL=Invoice.d.ts.map