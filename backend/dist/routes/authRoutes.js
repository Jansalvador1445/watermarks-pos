"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validate_1 = require("../middlewares/validate");
const schemas_1 = require("../validators/schemas");
const auth_1 = require("../middlewares/auth");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = (0, express_1.Router)();
router.post('/login', rateLimiter_1.authLimiter, (0, validate_1.validate)(schemas_1.loginSchema), authController_1.login);
router.post('/refresh', authController_1.refresh);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/me', auth_1.authenticate, authController_1.getMe);
router.post('/onboarding', auth_1.authenticate, (0, validate_1.validate)(schemas_1.onboardingSchema), authController_1.completeOnboarding);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map