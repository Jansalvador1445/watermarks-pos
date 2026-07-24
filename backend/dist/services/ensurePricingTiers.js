"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePricingTiers = ensurePricingTiers;
const PricingTier_1 = require("../models/PricingTier");
const logger_1 = require("../config/logger");
const DEFAULT_TIERS = [
    { code: PricingTier_1.PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
    { code: PricingTier_1.PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
    { code: PricingTier_1.PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
];
async function ensurePricingTiers() {
    for (const tier of DEFAULT_TIERS) {
        await PricingTier_1.PricingTier.findOneAndUpdate({ code: tier.code }, {
            $set: { label: tier.label },
            $setOnInsert: { slimPrice: tier.slimPrice, roundPrice: tier.roundPrice, code: tier.code },
        }, { upsert: true, new: true });
    }
    const count = await PricingTier_1.PricingTier.countDocuments();
    logger_1.logger.info(`Pricing tiers ready (${count} tier(s))`);
}
//# sourceMappingURL=ensurePricingTiers.js.map