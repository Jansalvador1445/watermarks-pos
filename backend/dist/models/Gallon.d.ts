import mongoose, { Document, Types } from 'mongoose';
import { GallonType } from '../types/enums';
export interface IGallonHistory {
    direction: 'out' | 'return';
    quantity: number;
    date: Date;
    userId?: Types.ObjectId;
    remarks?: string;
}
export interface IGallon extends Document {
    itemKey: string;
    label: string;
    /** @deprecated legacy slim/round link for deliveries */
    type?: GallonType;
    currentIn: number;
    currentOut: number;
    returned: number;
    date: Date;
    history: IGallonHistory[];
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Gallon: mongoose.Model<IGallon, {}, {}, {}, mongoose.Document<unknown, {}, IGallon, {}, mongoose.DefaultSchemaOptions> & IGallon & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IGallon>;
export interface IInventoryHistory {
    action: string;
    quantity: number;
    date: Date;
    userId?: Types.ObjectId;
    remarks?: string;
}
export interface IInventory extends Document {
    publicId: string;
    name: string;
    sku?: string;
    unit: string;
    category: string;
    price: number;
    description?: string;
    /** Internal: links refill stock to slim/round for delivery/POS when no product link */
    refillType?: GallonType;
    currentStock: number;
    lowStockThreshold: number;
    borrowed: number;
    returned: number;
    history: IInventoryHistory[];
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Inventory: mongoose.Model<IInventory, {}, {}, {}, mongoose.Document<unknown, {}, IInventory, {}, mongoose.DefaultSchemaOptions> & IInventory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInventory>;
//# sourceMappingURL=Gallon.d.ts.map