/** Resolve selling price from product tier fields. Falls back to retail (price). */
export declare const getProductPriceForTier: (product: {
    price: number;
    tierBPrice?: number | null;
    tierCPrice?: number | null;
}, tierCode?: string) => number;
export declare const TIER_DISPLAY: Record<string, {
    name: string;
    role: string;
}>;
//# sourceMappingURL=productPricing.d.ts.map