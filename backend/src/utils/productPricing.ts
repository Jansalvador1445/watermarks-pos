/** Resolve selling price from product tier fields. Falls back to retail (price). */
export const getProductPriceForTier = (
  product: { price: number; tierBPrice?: number | null; tierCPrice?: number | null },
  tierCode?: string,
): number => {
  if (tierCode === 'tier_b' && product.tierBPrice != null) return product.tierBPrice;
  if (tierCode === 'tier_c' && product.tierCPrice != null) return product.tierCPrice;
  return product.price;
};

export const TIER_DISPLAY: Record<string, { name: string; role: string }> = {
  tier_a: { name: 'Retail', role: 'Standard walk-in & regular customers' },
  tier_b: { name: 'Wholesale', role: 'Bulk / reseller customers' },
  tier_c: { name: 'Special', role: 'Custom or negotiated customers' },
};
