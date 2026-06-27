import mongoose, { Document } from 'mongoose';
export declare enum PricingTierCode {
    TIER_A = "tier_a",
    TIER_B = "tier_b",
    TIER_C = "tier_c"
}
export interface IPricingTier extends Document {
    code: PricingTierCode;
    label: string;
    slimPrice: number;
    roundPrice: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PricingTier: mongoose.Model<IPricingTier, {}, {}, {}, mongoose.Document<unknown, {}, IPricingTier, {}, mongoose.DefaultSchemaOptions> & IPricingTier & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPricingTier>;
//# sourceMappingURL=PricingTier.d.ts.map