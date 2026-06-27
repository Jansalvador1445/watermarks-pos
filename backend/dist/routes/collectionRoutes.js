"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const collectionController_1 = require("../controllers/collectionController");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/daily', (0, rbac_1.authorize)('collection:read'), collectionController_1.getDailyCollection);
exports.default = router;
//# sourceMappingURL=collectionRoutes.js.map