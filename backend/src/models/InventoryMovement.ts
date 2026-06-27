import mongoose, { Document, Schema, Types } from 'mongoose';
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

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    date: { type: Date, required: true, default: Date.now },
    itemId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    movementType: { type: String, enum: Object.values(InventoryMovementType), required: true },
    quantity: { type: Number, required: true },
    beforeStock: { type: Number, required: true, min: 0 },
    afterStock: { type: Number, required: true, min: 0 },
    referenceNo: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

inventoryMovementSchema.index({ date: -1 });
inventoryMovementSchema.index({ itemId: 1, date: -1 });
inventoryMovementSchema.index({ movementType: 1, date: -1 });
inventoryMovementSchema.index({ referenceNo: 1 });
inventoryMovementSchema.index(
  { referenceNo: 1, itemId: 1, movementType: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
inventoryMovementSchema.index({ isDeleted: 1 });

export const InventoryMovement = mongoose.model<IInventoryMovement>(
  'InventoryMovement',
  inventoryMovementSchema,
);
