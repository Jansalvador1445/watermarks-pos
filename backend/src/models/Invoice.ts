import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentMethod } from '../types/enums';
import { generateSecureReference } from '../utils/secureReference';

export enum InvoiceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED = 'converted',
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

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNo: {
      type: String,
      unique: true,
      default: () => generateSecureReference('INV'),
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.PENDING,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryId: { type: Schema.Types.ObjectId, ref: 'Delivery' },
    legacyWaterOrder: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ isDeleted: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

/** @deprecated Use Invoice — kept for migration compatibility */
export { Invoice as WaterOrder, InvoiceStatus as WaterOrderStatus };
export type IWaterOrder = IInvoice;
