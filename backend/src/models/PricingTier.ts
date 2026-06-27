import mongoose, { Document, Schema } from 'mongoose';

export enum PricingTierCode {
  TIER_A = 'tier_a',
  TIER_B = 'tier_b',
  TIER_C = 'tier_c',
}

export interface IPricingTier extends Document {
  code: PricingTierCode;
  label: string;
  slimPrice: number;
  roundPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const pricingTierSchema = new Schema<IPricingTier>(
  {
    code: { type: String, enum: Object.values(PricingTierCode), required: true, unique: true },
    label: { type: String, required: true, trim: true },
    slimPrice: { type: Number, required: true, min: 0, default: 0 },
    roundPrice: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

export const PricingTier = mongoose.model<IPricingTier>('PricingTier', pricingTierSchema);
