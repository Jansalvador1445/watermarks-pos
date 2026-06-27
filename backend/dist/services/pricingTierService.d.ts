export declare class PricingTierService {
    static list(): Promise<(import("../models/PricingTier").IPricingTier & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/PricingTier").IPricingTier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/PricingTier").IPricingTier & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(id: string, data: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, import("../models/PricingTier").IPricingTier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/PricingTier").IPricingTier & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=pricingTierService.d.ts.map