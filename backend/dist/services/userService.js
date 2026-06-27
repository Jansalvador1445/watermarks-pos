"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = exports.BackupService = exports.LogService = exports.NotificationService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
const permissions_1 = require("../utils/permissions");
const generatePassword_1 = require("../utils/generatePassword");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
class UserService {
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { search, role, status } = req.query;
        const filter = { isDeleted: false };
        if (role)
            filter.role = role;
        if (status)
            filter.status = status;
        Object.assign(filter, (0, pagination_1.buildSearchQuery)(search, ['name', 'email', 'username']));
        const [data, total] = await Promise.all([
            User_1.User.find(filter).select('-passwordHash -refreshToken').sort(sort).skip(skip).limit(limit).lean(),
            User_1.User.countDocuments(filter),
        ]);
        return { data, pagination: { page, limit, total } };
    }
    static async getById(id) {
        const user = await User_1.User.findOne({ _id: id, isDeleted: false }).select('-passwordHash -refreshToken');
        if (!user)
            throw new response_1.AppError('User not found', 404);
        return user;
    }
    static async create(data) {
        const existing = await User_1.User.findOne({ email: data.email.toLowerCase().trim() });
        if (existing)
            throw new response_1.AppError('Email already exists', 409);
        if (data.role === enums_1.UserRole.CUSTOM) {
            if (!Array.isArray(data.customPermissions) || data.customPermissions.length === 0) {
                throw new response_1.AppError('Custom role requires at least one permission', 400);
            }
            (0, permissions_1.validateCustomPermissions)(data.customPermissions);
        }
        else {
            delete data.customPermissions;
        }
        const tempPassword = (0, generatePassword_1.generateTempPassword)();
        const passwordHash = await bcryptjs_1.default.hash(tempPassword, 12);
        const user = await User_1.User.create({
            ...data,
            email: data.email.toLowerCase().trim(),
            passwordHash,
            isOnboarded: false,
        });
        const safeUser = await User_1.User.findById(user._id).select('-passwordHash -refreshToken');
        return { user: safeUser, tempPassword };
    }
    static async update(id, data) {
        if (data.password) {
            data.passwordHash = await bcryptjs_1.default.hash(data.password, 12);
            delete data.password;
        }
        const role = data.role;
        const unset = {};
        if (role && role !== enums_1.UserRole.CUSTOM) {
            unset.customPermissions = 1;
            delete data.customPermissions;
        }
        if (role === enums_1.UserRole.CUSTOM || data.customPermissions) {
            const perms = data.customPermissions;
            if (!perms?.length)
                throw new response_1.AppError('Custom role requires at least one permission', 400);
            (0, permissions_1.validateCustomPermissions)(perms);
        }
        const updateOps = { $set: data };
        if (Object.keys(unset).length > 0)
            updateOps.$unset = unset;
        const user = await User_1.User.findOneAndUpdate({ _id: id, isDeleted: false }, updateOps, { new: true, runValidators: true }).select('-passwordHash -refreshToken');
        if (!user)
            throw new response_1.AppError('User not found', 404);
        return user;
    }
    static async updatePermissions(id, customPermissions) {
        (0, permissions_1.validateCustomPermissions)(customPermissions);
        const user = await User_1.User.findOneAndUpdate({ _id: id, isDeleted: false, role: { $ne: enums_1.UserRole.ADMIN } }, { role: enums_1.UserRole.CUSTOM, customPermissions }, { new: true, runValidators: true }).select('-passwordHash -refreshToken');
        if (!user)
            throw new response_1.AppError('User not found or cannot modify admin permissions', 404);
        return user;
    }
    static async delete(id) {
        const user = await User_1.User.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!user)
            throw new response_1.AppError('User not found', 404);
        return user;
    }
}
exports.UserService = UserService;
class NotificationService {
    static async getAll(req, userId) {
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const filter = {};
        if (userId)
            filter.$or = [{ userId }, { userId: { $exists: false } }];
        const [data, total, unreadCount] = await Promise.all([
            Notification_1.Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Notification_1.Notification.countDocuments(filter),
            Notification_1.Notification.countDocuments({ ...filter, isRead: false }),
        ]);
        return { data, pagination: { page, limit, total }, unreadCount };
    }
    static async markAsRead(id) {
        return Notification_1.Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }
    static async markAllAsRead(userId) {
        const filter = { isRead: false };
        if (userId)
            filter.userId = userId;
        await Notification_1.Notification.updateMany(filter, { isRead: true });
        return { message: 'All notifications marked as read' };
    }
    static async create(data) {
        return Notification_1.Notification.create(data);
    }
}
exports.NotificationService = NotificationService;
class LogService {
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { search, module, startDate, endDate } = req.query;
        const filter = {};
        if (module)
            filter.module = module;
        if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (search) {
            filter.$or = [{ action: new RegExp(search, 'i') }, { module: new RegExp(search, 'i') }];
        }
        const [data, total] = await Promise.all([
            Notification_1.Log.find(filter).populate('userId', 'name role avatar').sort(sort).skip(skip).limit(limit).lean(),
            Notification_1.Log.countDocuments(filter),
        ]);
        return { data, pagination: { page, limit, total } };
    }
}
exports.LogService = LogService;
const BACKUP_COLLECTIONS = [
    'users',
    'customers',
    'deliveries',
    'transactions',
    'inventories',
    'inventorymovements',
    'products',
    'gallons',
    'notifications',
    'logs',
    'settings',
    'backups',
    'waterorders',
];
class BackupService {
    static async getAll() {
        return Notification_1.Backup.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).lean();
    }
    static async getLatest() {
        return Notification_1.Backup.findOne().sort({ createdAt: -1 }).select('createdAt filename size');
    }
    static async create(userId) {
        const backupDir = path_1.default.join(process.cwd(), env_1.env.BACKUP_DIR);
        if (!fs_1.default.existsSync(backupDir))
            fs_1.default.mkdirSync(backupDir, { recursive: true });
        const filename = `backup-${Date.now()}.json`;
        const filepath = path_1.default.join(backupDir, filename);
        const collections = {};
        const db = mongoose_1.default.connection.db;
        if (db) {
            for (const name of BACKUP_COLLECTIONS) {
                try {
                    const docs = await db.collection(name).find({}).toArray();
                    collections[name] = docs;
                }
                catch {
                    collections[name] = [];
                }
            }
        }
        const backupData = {
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            collections,
        };
        fs_1.default.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        const stats = fs_1.default.statSync(filepath);
        return Notification_1.Backup.create({
            filename,
            size: stats.size,
            createdBy: userId,
        });
    }
    static async download(id) {
        const backup = await Notification_1.Backup.findById(id);
        if (!backup)
            throw new response_1.AppError('Backup not found', 404);
        const filepath = path_1.default.join(process.cwd(), env_1.env.BACKUP_DIR, backup.filename);
        if (!fs_1.default.existsSync(filepath))
            throw new response_1.AppError('Backup file not found', 404);
        return { filepath, filename: backup.filename };
    }
}
exports.BackupService = BackupService;
class SettingsService {
    static async get() {
        let settings = await Notification_1.Settings.findOne();
        if (!settings) {
            settings = await Notification_1.Settings.create({});
        }
        return settings;
    }
    static async update(data) {
        let settings = await Notification_1.Settings.findOne();
        if (!settings) {
            settings = await Notification_1.Settings.create(data);
        }
        else {
            Object.assign(settings, data);
            await settings.save();
        }
        return settings;
    }
}
exports.SettingsService = SettingsService;
//# sourceMappingURL=userService.js.map