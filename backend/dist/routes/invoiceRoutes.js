"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = require("../controllers/invoiceController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../validators/schemas");
const auditLog_1 = require("../middlewares/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, rbac_1.authorize)('orders:read', 'orders:*'), invoiceController_1.getInvoices);
router.get('/:id', (0, rbac_1.authorize)('orders:read', 'orders:*'), invoiceController_1.getInvoice);
router.post('/', (0, rbac_1.authorize)('orders:*'), (0, validate_1.validate)(schemas_1.createInvoiceSchema), (0, auditLog_1.auditLog)('orders', 'create'), invoiceController_1.createInvoice);
router.put('/:id', (0, rbac_1.authorize)('orders:*'), (0, validate_1.validate)(schemas_1.updateInvoiceSchema), (0, auditLog_1.auditLog)('orders', 'update'), invoiceController_1.updateInvoice);
router.delete('/:id', (0, rbac_1.authorize)('orders:*'), (0, auditLog_1.auditLog)('orders', 'delete'), invoiceController_1.deleteInvoice);
router.post('/:id/convert', (0, rbac_1.authorize)('orders:*'), (0, auditLog_1.auditLog)('orders', 'convert'), invoiceController_1.convertInvoice);
exports.default = router;
//# sourceMappingURL=invoiceRoutes.js.map