"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = exports.updateSettings = exports.getSettings = exports.downloadBackup = exports.createBackup = exports.getBackups = exports.getLogs = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = exports.deleteUser = exports.updateUserPermissions = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const userService_1 = require("../services/userService");
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
const enums_1 = require("../types/enums");
exports.getUsers = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await userService_1.UserService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getUser = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.UserService.getById((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.createUser = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.UserService.create(req.body);
    return (0, response_1.successResponse)(res, data, 'User created', 201);
});
exports.updateUser = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.UserService.update((0, params_1.getParamId)(req), req.body);
    return (0, response_1.successResponse)(res, data, 'User updated');
});
exports.updateUserPermissions = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.UserService.updatePermissions((0, params_1.getParamId)(req), req.body.customPermissions);
    return (0, response_1.successResponse)(res, data, 'User permissions updated');
});
exports.deleteUser = (0, response_1.asyncHandler)(async (req, res) => {
    await userService_1.UserService.delete((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, null, 'User deleted');
});
exports.getNotifications = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await userService_1.NotificationService.getAll(req, req.user?.userId);
    return (0, response_1.successResponse)(res, result);
});
exports.markNotificationRead = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.NotificationService.markAsRead((0, params_1.getParamId)(req));
    return (0, response_1.successResponse)(res, data);
});
exports.markAllNotificationsRead = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.NotificationService.markAllAsRead(req.user?.userId);
    return (0, response_1.successResponse)(res, data);
});
exports.getLogs = (0, response_1.asyncHandler)(async (req, res) => {
    const result = await userService_1.LogService.getAll(req);
    return (0, response_1.paginatedResponse)(res, result.data, result.pagination);
});
exports.getBackups = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await userService_1.BackupService.getAll();
    return (0, response_1.successResponse)(res, data);
});
exports.createBackup = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.BackupService.create(req.user.userId);
    return (0, response_1.successResponse)(res, data, 'Backup created', 201);
});
exports.downloadBackup = (0, response_1.asyncHandler)(async (req, res) => {
    const { filepath, filename } = await userService_1.BackupService.download((0, params_1.getParamId)(req));
    return res.download(filepath, filename);
});
exports.getSettings = (0, response_1.asyncHandler)(async (_req, res) => {
    const data = await userService_1.SettingsService.get();
    return (0, response_1.successResponse)(res, data);
});
exports.updateSettings = (0, response_1.asyncHandler)(async (req, res) => {
    const data = await userService_1.SettingsService.update(req.body);
    return (0, response_1.successResponse)(res, data, 'Settings updated');
});
exports.globalSearch = (0, response_1.asyncHandler)(async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return (0, response_1.successResponse)(res, { customers: [], transactions: [], deliveries: [], users: [] });
    }
    const { Customer, Delivery } = await Promise.resolve().then(() => __importStar(require('../models/Customer')));
    const { Transaction } = await Promise.resolve().then(() => __importStar(require('../models/Transaction')));
    const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
    const { escapeRegex } = await Promise.resolve().then(() => __importStar(require('../utils/pagination')));
    const term = q.trim();
    if (term.length < 2) {
        return (0, response_1.successResponse)(res, { customers: [], transactions: [], deliveries: [], users: [] });
    }
    const regex = new RegExp(escapeRegex(term), 'i');
    const isAdmin = req.user?.role === enums_1.UserRole.ADMIN;
    const matchingCustomers = await Customer.find({
        isDeleted: false,
        $or: [{ fullName: regex }, { phone: regex }, { address: regex }],
    })
        .select('_id fullName phone')
        .limit(10)
        .lean();
    const customerIds = matchingCustomers.map((c) => c._id);
    const customers = matchingCustomers.slice(0, 5);
    const [transactions, deliveries, users] = await Promise.all([
        Transaction.find({
            isDeleted: false,
            $or: [{ invoiceNo: regex }, { customerName: regex }],
        })
            .select('_id invoiceNo customerName amount createdAt')
            .limit(5)
            .lean(),
        Delivery.find({
            isDeleted: false,
            $or: [{ customerId: { $in: customerIds } }, { schedule: regex }, { remarks: regex }],
        })
            .populate('customerId', 'fullName')
            .select('_id customerId date status schedule')
            .limit(5)
            .lean(),
        isAdmin
            ? User.find({
                isDeleted: false,
                $or: [{ name: regex }, { email: regex }, { username: regex }],
            })
                .select('_id name email username role')
                .limit(5)
                .lean()
            : Promise.resolve([]),
    ]);
    return (0, response_1.successResponse)(res, { customers, transactions, deliveries, users });
});
//# sourceMappingURL=userController.js.map