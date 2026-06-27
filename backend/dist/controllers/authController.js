"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = exports.getMe = exports.logout = exports.refresh = exports.login = void 0;
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
exports.login = (0, response_1.asyncHandler)(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await authService_1.AuthService.login(identifier, password, res, req.ip);
    return (0, response_1.successResponse)(res, result, 'Login successful');
});
exports.refresh = (0, response_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.refreshToken;
    const result = await authService_1.AuthService.refresh(token, res);
    return (0, response_1.successResponse)(res, result, 'Token refreshed');
});
exports.logout = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await authService_1.AuthService.logout(req.user.userId, res);
    return (0, response_1.successResponse)(res, result, 'Logged out');
});
exports.getMe = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await authService_1.AuthService.getMe(req.user.userId);
    return (0, response_1.successResponse)(res, result);
});
exports.completeOnboarding = (0, response_1.asyncHandler)(async (req, res) => {
    const { username, email, password } = req.body;
    const result = await authService_1.AuthService.completeOnboarding(req.user.userId, { username, email, password }, res);
    return (0, response_1.successResponse)(res, result, 'Account setup complete');
});
//# sourceMappingURL=authController.js.map