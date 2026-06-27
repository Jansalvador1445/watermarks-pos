import mongoose, { Document, Types } from 'mongoose';
import { GallonType, ProductCategory, ProductStatus } from '../types/enums';
export interface IProduct extends Document {
    name: string;
    price: number;
    purchasePrice?: number;
    tierBPrice?: number;
    tierCPrice?: number;
    gallonType?: GallonType;
    linkedInventoryId?: Types.ObjectId;
    category: ProductCategory;
    decrementsStock: boolean;
    status: ProductStatus;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, mongoose.DefaultSchemaOptions> & IProduct & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProduct>;
//# sourceMappingURL=Product.d.ts.map