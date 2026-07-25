"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceReportController_1 = require("../controllers/invoiceReportController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/summary', (0, rbac_1.authorize)('reports:read', 'dashboard:read'), invoiceReportController_1.getInvoiceSummaryReport);
router.get('/outstanding', (0, rbac_1.authorize)('reports:read', 'dashboard:read'), invoiceReportController_1.getInvoiceOutstandingReport);
exports.default = router;
//# sourceMappingURL=invoiceReportRoutes.js.map