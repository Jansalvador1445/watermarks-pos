"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authorize = void 0;
const response_1 = require("../utils/response");
const enums_1 = require("../types/enums");
const matchPermission = (userPerms, required) => {
    return userPerms.some((perm) => {
        if (perm === '*')
            return true;
        if (perm === required)
            return true;
        const [module, action] = perm.split(':');
        const [reqModule, reqAction] = required.split(':');
        return module === reqModule && action === '*';
    });
};
const getUserPermissions = (req) => {
    const role = req.user.role;
    if (role === enums_1.UserRole.ADMIN)
        return ['*'];
    if (req.user.customPermissions?.length)
        return req.user.customPermissions;
    return enums_1.ROLE_PERMISSIONS[role] || [];
};
const authorize = (...permissions) => (req, _res, next) => {
    if (!req.user) {
        return next(new response_1.AppError('Authentication required', 401));
    }
    const userPerms = getUserPermissions(req);
    const hasPermission = permissions.some((p) => matchPermission(userPerms, p));
    if (!hasPermission) {
        return next(new response_1.AppError('Insufficient permissions', 403));
    }
    next();
};
exports.authorize = authorize;
const authorizeRoles = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new response_1.AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
        return next(new response_1.AppError('Insufficient permissions', 403));
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=rbac.js.map