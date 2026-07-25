"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../validators/schemas");
const auditLog_1 = require("../middlewares/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/invoice/:invoiceId', (0, rbac_1.authorize)('orders:read', 'orders:*'), paymentController_1.listPaymentsByInvoice);
router.post('/', (0, rbac_1.authorize)('orders:*'), (0, validate_1.validate)(schemas_1.createPaymentSchema), (0, auditLog_1.auditLog)('payments', 'create'), paymentController_1.createPayment);
router.delete('/:id', (0, rbac_1.authorize)('orders:*'), (0, auditLog_1.auditLog)('payments', 'delete'), paymentController_1.deletePayment);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map