import mongoose, { Document, Schema, Types } from 'mongoose';
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

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, min: 0 },
    tierBPrice: { type: Number, min: 0 },
    tierCPrice: { type: Number, min: 0 },
    gallonType: { type: String, enum: Object.values(GallonType) },
    linkedInventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      default: ProductCategory.OTHER,
    },
    decrementsStock: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(ProductStatus), default: ProductStatus.ACTIVE },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text' });
productSchema.index({ isDeleted: 1, status: 1 });
productSchema.index({ linkedInventoryId: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
