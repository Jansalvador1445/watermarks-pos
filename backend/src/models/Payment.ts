import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentMethod } from '../types/enums';

export interface IPayment extends Document {
  invoiceId: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  notes?: string;
  recordedBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ invoiceId: 1, isDeleted: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ isDeleted: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
