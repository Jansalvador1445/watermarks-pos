"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const waterOrderController_1 = require("../controllers/waterOrderController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../validators/schemas");
const auditLog_1 = require("../middlewares/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, rbac_1.authorize)('orders:read', 'orders:*'), waterOrderController_1.getWaterOrders);
router.get('/:id', (0, rbac_1.authorize)('orders:read', 'orders:*'), waterOrderController_1.getWaterOrder);
router.post('/', (0, rbac_1.authorize)('orders:*'), (0, validate_1.validate)(schemas_1.createWaterOrderSchema), (0, auditLog_1.auditLog)('orders', 'create'), waterOrderController_1.createWaterOrder);
router.put('/:id', (0, rbac_1.authorize)('orders:*'), (0, validate_1.validate)(schemas_1.updateWaterOrderSchema), (0, auditLog_1.auditLog)('orders', 'update'), waterOrderController_1.updateWaterOrder);
router.delete('/:id', (0, rbac_1.authorize)('orders:*'), (0, auditLog_1.auditLog)('orders', 'delete'), waterOrderController_1.deleteWaterOrder);
router.post('/:id/convert', (0, rbac_1.authorize)('orders:*'), (0, auditLog_1.auditLog)('orders', 'convert'), waterOrderController_1.convertWaterOrder);
exports.default = router;
//# sourceMappingURL=waterOrderRoutes.js.map