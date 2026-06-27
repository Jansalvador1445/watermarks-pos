"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../validators/schemas");
const auditLog_1 = require("../middlewares/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, rbac_1.authorize)('transactions:read', 'transactions:*', 'pos:*'), transactionController_1.getTransactions);
router.get('/:id', (0, rbac_1.authorize)('transactions:read', 'transactions:*', 'pos:*'), transactionController_1.getTransaction);
router.post('/', (0, rbac_1.authorize)('transactions:*', 'pos:*'), (0, validate_1.validate)(schemas_1.createTransactionSchema), (0, auditLog_1.auditLog)('transactions', 'create'), transactionController_1.createTransaction);
router.put('/:id', (0, rbac_1.authorize)('transactions:*', 'pos:*'), (0, validate_1.validate)(schemas_1.updateTransactionSchema), (0, auditLog_1.auditLog)('transactions', 'update'), transactionController_1.updateTransaction);
router.delete('/:id', (0, rbac_1.authorize)('transactions:*'), (0, auditLog_1.auditLog)('transactions', 'delete'), transactionController_1.deleteTransaction);
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map