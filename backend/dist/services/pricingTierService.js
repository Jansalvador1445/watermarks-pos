"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingTierService = void 0;
const PricingTier_1 = require("../models/PricingTier");
const response_1 = require("../utils/response");
class PricingTierService {
    static async list() {
        return PricingTier_1.PricingTier.find().sort({ code: 1 }).lean();
    }
    static async getById(id) {
        const tier = await PricingTier_1.PricingTier.findById(id);
        if (!tier)
            throw new response_1.AppError('Pricing tier not found', 404);
        return tier;
    }
    static async update(id, data) {
        const tier = await PricingTier_1.PricingTier.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
        if (!tier)
            throw new response_1.AppError('Pricing tier not found', 404);
        return tier;
    }
}
exports.PricingTierService = PricingTierService;
//# sourceMappingURL=pricingTierService.js.map