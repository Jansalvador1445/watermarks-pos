"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pricingTierController_1 = require("../controllers/pricingTierController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../validators/schemas");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, rbac_1.authorize)('customers:read', 'customers:*', 'settings:read'), pricingTierController_1.getPricingTiers);
router.put('/:id', (0, rbac_1.authorizeRoles)(enums_1.UserRole.ADMIN), (0, validate_1.validate)(schemas_1.updatePricingTierSchema), pricingTierController_1.updatePricingTier);
exports.default = router;
//# sourceMappingURL=pricingTierRoutes.js.map