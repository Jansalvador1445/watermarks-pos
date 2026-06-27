"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_DISPLAY = exports.getProductPriceForTier = void 0;
/** Resolve selling price from product tier fields. Falls back to retail (price). */
const getProductPriceForTier = (product, tierCode) => {
    if (tierCode === 'tier_b' && product.tierBPrice != null)
        return product.tierBPrice;
    if (tierCode === 'tier_c' && product.tierCPrice != null)
        return product.tierCPrice;
    return product.price;
};
exports.getProductPriceForTier = getProductPriceForTier;
exports.TIER_DISPLAY = {
    tier_a: { name: 'Retail', role: 'Standard walk-in & regular customers' },
    tier_b: { name: 'Wholesale', role: 'Bulk / reseller customers' },
    tier_c: { name: 'Special', role: 'Custom or negotiated customers' },
};
//# sourceMappingURL=productPricing.js.map