import { PricingTier, PricingTierCode } from '../models/PricingTier';
import { logger } from '../config/logger';

const DEFAULT_TIERS = [
  { code: PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
  { code: PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
  { code: PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
];

export async function ensurePricingTiers() {
  for (const tier of DEFAULT_TIERS) {
    await PricingTier.findOneAndUpdate(
      { code: tier.code },
      {
        $set: { label: tier.label },
        $setOnInsert: { slimPrice: tier.slimPrice, roundPrice: tier.roundPrice, code: tier.code },
      },
      { upsert: true, new: true },
    );
  }

  const count = await PricingTier.countDocuments();
  logger.info(`Pricing tiers ready (${count} tier(s))`);
}
