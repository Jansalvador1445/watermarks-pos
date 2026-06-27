"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const authenticate = (req, _res, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            throw new response_1.AppError('Authentication required', 401);
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch {
        next(new response_1.AppError('Invalid or expired token', 401));
    }
};
exports.authenticate = authenticate;
const optionalAuth = (req, _res, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (token) {
            req.user = (0, jwt_1.verifyAccessToken)(token);
        }
    }
    catch {
        // ignore
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map