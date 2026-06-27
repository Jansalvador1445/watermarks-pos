"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUserPermissions = exports.validateCustomPermissions = exports.ALL_ASSIGNABLE_PERMISSIONS = exports.ADMIN_ONLY_PERMISSIONS = void 0;
const enums_1 = require("../types/enums");
const response_1 = require("./response");
exports.ADMIN_ONLY_PERMISSIONS = [
    'users:read',
    'users:*',
    'logs:read',
    'logs:*',
    'backup:read',
    'backup:*',
    'settings:read',
    'settings:*',
];
exports.ALL_ASSIGNABLE_PERMISSIONS = [
    'dashboard:read',
    'customers:read',
    'customers:*',
    'deliveries:read',
    'deliveries:*',
    'orders:read',
    'orders:*',
    'transactions:read',
    'transactions:*',
    'pos:*',
    'gallons:read',
    'gallons:*',
    'inventory:read',
    'inventory:*',
    'reports:read',
    'notifications:read',
    'collection:read',
];
const validateCustomPermissions = (permissions) => {
    const invalid = permissions.filter((p) => exports.ADMIN_ONLY_PERMISSIONS.includes(p) ||
        (!exports.ALL_ASSIGNABLE_PERMISSIONS.includes(p) && p !== '*'));
    if (invalid.length > 0) {
        throw new response_1.AppError(`Invalid or admin-only permissions: ${invalid.join(', ')}`, 400);
    }
    return permissions;
};
exports.validateCustomPermissions = validateCustomPermissions;
const resolveUserPermissions = (role, customPermissions) => {
    if (role === enums_1.UserRole.ADMIN)
        return ['*'];
    if (customPermissions?.length)
        return customPermissions;
    return [];
};
exports.resolveUserPermissions = resolveUserPermissions;
//# sourceMappingURL=permissions.js.map