import mongoose, { Document, Types } from 'mongoose';
import { InventoryMovementType } from '../types/enums';
export interface IInventoryMovement extends Document {
    date: Date;
    itemId: Types.ObjectId;
    movementType: InventoryMovementType;
    quantity: number;
    beforeStock: number;
    afterStock: number;
    referenceNo: string;
    userId: Types.ObjectId;
    remarks?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const InventoryMovement: mongoose.Model<IInventoryMovement, {}, {}, {}, mongoose.Document<unknown, {}, IInventoryMovement, {}, mongoose.DefaultSchemaOptions> & IInventoryMovement & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInventoryMovement>;
//# sourceMappingURL=InventoryMovement.d.ts.map