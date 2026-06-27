import mongoose, { Document, Schema, Types } from 'mongoose';
import { GallonType } from '../types/enums';
import { generateSecureReference } from '../utils/secureReference';

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

const gallonSchema = new Schema<IGallon>(
  {
    itemKey: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(GallonType) },
    currentIn: { type: Number, default: 0, min: 0 },
    currentOut: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
    history: [
      {
        direction: { type: String, enum: ['out', 'return'], required: true },
        quantity: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

gallonSchema.index({ itemKey: 1, date: -1 });
gallonSchema.index(
  { itemKey: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export const Gallon = mongoose.model<IGallon>('Gallon', gallonSchema);

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

const inventorySchema = new Schema<IInventory>(
  {
    publicId: {
      type: String,
      unique: true,
      default: () => generateSecureReference('ITM'),
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    unit: { type: String, required: true, trim: true, default: 'pcs' },
    category: { type: String, required: true, trim: true, default: 'general' },
    price: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true },
    refillType: { type: String, enum: Object.values(GallonType) },
    currentStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    borrowed: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
    history: [
      {
        action: { type: String, required: true },
        quantity: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

inventorySchema.index({ name: 'text', sku: 'text', category: 1 });
inventorySchema.index({ isDeleted: 1 });
inventorySchema.index({ publicId: 1 });
inventorySchema.index({ refillType: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
