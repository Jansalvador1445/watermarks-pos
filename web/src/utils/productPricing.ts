import type { PricingTier, Product, Customer } from '@/types';

export type ProductTierCode = 'tier_a' | 'tier_b' | 'tier_c';

export const TIER_DISPLAY: Record<ProductTierCode, { name: string; role: string }> = {
  tier_a: { name: 'Retail', role: 'Standard walk-in & regular customers' },
  tier_b: { name: 'Wholesale', role: 'Bulk / reseller customers' },
  tier_c: { name: 'Special', role: 'Custom or negotiated customers' },
};

const TIER_SELLING_LABELS: Record<ProductTierCode, string> = {
  tier_a: 'Retail Price',
  tier_b: 'Wholesale Price',
  tier_c: 'Special Price',
};

export const getTierSellingLabel = (code: string, fallbackLabel?: string): string => {
  if (code in TIER_SELLING_LABELS) {
    return TIER_SELLING_LABELS[code as ProductTierCode];
  }
  return fallbackLabel ?? 'Selling Price';
};

export const getCustomerTierCode = (customer?: Customer | null): string | undefined => {
  const tier = customer?.pricingCategory;
  if (typeof tier === 'object' && tier !== null && 'code' in tier) {
    return tier.code;
  }
  return undefined;
};

export const getCustomerTierLabel = (customer?: Customer | null): string => {
  const tier = customer?.pricingCategory;
  if (typeof tier === 'object' && tier !== null) {
    const code = tier.code as ProductTierCode;
    return TIER_DISPLAY[code]?.name ?? tier.label;
  }
  return 'Retail';
};

/** Resolve the selling price for a product based on customer pricing tier. Falls back to retail. */
export const getProductPriceForTier = (
  product: Pick<Product, 'price' | 'tierBPrice' | 'tierCPrice'>,
  tierCode?: string,
): number => {
  if (tierCode === 'tier_b' && product.tierBPrice != null) return product.tierBPrice;
  if (tierCode === 'tier_c' && product.tierCPrice != null) return product.tierCPrice;
  return product.price;
};

export const formatProductTierPrices = (product: Product): string => {
  const parts = [`Retail ${product.price}`];
  if (product.tierBPrice != null) parts.push(`Wholesale ${product.tierBPrice}`);
  if (product.tierCPrice != null) parts.push(`Special ${product.tierCPrice}`);
  return parts.join(' · ');
};

export const sortPricingTiers = (tiers: PricingTier[]): PricingTier[] =>
  [...tiers].sort((a, b) => a.code.localeCompare(b.code));
