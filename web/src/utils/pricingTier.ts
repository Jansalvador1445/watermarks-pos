import type { Customer, PricingTier } from '@/types';

const TIER_CODE_LETTERS: Record<string, string> = {
  tier_a: 'A',
  tier_b: 'B',
  tier_c: 'C',
};

export const codeToCategoryLetter = (code: string) => TIER_CODE_LETTERS[code] ?? code.toUpperCase();

export const buildTierOptions = (tiers: PricingTier[] | undefined) =>
  tiers?.map((t) => ({
    label: `Category ${codeToCategoryLetter(t.code)} — ${t.label}`,
    value: t._id,
  })) ?? [];

export const getTierLabel = (tier: Customer['pricingCategory']) => {
  if (typeof tier === 'object' && tier !== null) {
    return `Category ${codeToCategoryLetter(tier.code)} — ${tier.label}`;
  }
  return '—';
};

export const getTierId = (tier: Customer['pricingCategory']) =>
  typeof tier === 'object' && tier !== null ? tier._id : String(tier);
