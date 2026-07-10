import mongoose, { Document, Schema, Types } from 'mongoose';
import { TransactionType, PaymentMethod, TransactionStatus } from '../types/enums';

export interface ITransactionItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  gallonType?: string;
  decrementsStock?: boolean;
}

export interface ITransaction extends Document {
  type: TransactionType;
  invoiceNo: string;
  customerId?: Types.ObjectId;
  customerName?: string;
  items: ITransactionItem[];
  paymentMethod: PaymentMethod;
  amount: number;
  discount: number;
  status: TransactionStatus;
  receiptUrl?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: Object.values(TransactionType), required: true },
    invoiceNo: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    items: [
      {
        productId: { type: String },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        gallonType: { type: String },
        decrementsStock: { type: Boolean },
      },
    ],
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.PAID },
    receiptUrl: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ isDeleted: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
