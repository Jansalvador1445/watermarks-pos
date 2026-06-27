"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePricingTier = exports.getPricingTiers = void 0;
const pricingTierService_1 = require("../services/pricingTierService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
exports.getPricingTiers = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await pricingTierService_1.PricingTierService.list();
    return (0, response_1.successResponse)(res, data);
});
exports.updatePricingTier = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await pricingTierService_1.PricingTierService.update((0, params_1.getParamId)(req), req.body);
    return (0, response_1.successResponse)(res, data, 'Pricing tier updated');
});
//# sourceMappingURL=pricingTierController.js.map