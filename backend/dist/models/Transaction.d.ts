import mongoose, { Document, Types } from 'mongoose';
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
export declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, mongoose.DefaultSchemaOptions> & ITransaction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITransaction>;
//# sourceMappingURL=Transaction.d.ts.map