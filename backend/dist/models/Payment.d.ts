import mongoose, { Document, Types } from 'mongoose';
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
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, mongoose.DefaultSchemaOptions> & IPayment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPayment>;
//# sourceMappingURL=Payment.d.ts.map