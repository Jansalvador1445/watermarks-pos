import mongoose, { Document, Types } from 'mongoose';
import { GallonType, PaymentMethod } from '../types/enums';
export declare enum WaterOrderStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CONVERTED = "converted"
}
export interface IWaterOrder extends Document {
    customerId: Types.ObjectId;
    gallonType: GallonType;
    quantity: number;
    preferredDate: Date;
    paymentMethod: PaymentMethod;
    notes?: string;
    status: WaterOrderStatus;
    createdBy: Types.ObjectId;
    deliveryId?: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WaterOrder: mongoose.Model<IWaterOrder, {}, {}, {}, mongoose.Document<unknown, {}, IWaterOrder, {}, mongoose.DefaultSchemaOptions> & IWaterOrder & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWaterOrder>;
//# sourceMappingURL=WaterOrder.d.ts.map