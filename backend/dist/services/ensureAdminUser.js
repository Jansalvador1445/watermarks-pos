"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdminUser = exports.DEFAULT_ADMIN_USERNAME = exports.DEFAULT_ADMIN_PASSWORD = exports.DEFAULT_ADMIN_EMAIL = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const enums_1 = require("../types/enums");
const logger_1 = require("../config/logger");
exports.DEFAULT_ADMIN_EMAIL = 'admin@h2o.com';
exports.DEFAULT_ADMIN_PASSWORD = 'Admin@123';
exports.DEFAULT_ADMIN_USERNAME = 'admin';
const ensureAdminUser = async () => {
    const adminExists = await User_1.User.findOne({ email: exports.DEFAULT_ADMIN_EMAIL });
    if (adminExists) {
        if (!adminExists.isOnboarded) {
            adminExists.isOnboarded = true;
            adminExists.username = adminExists.username || exports.DEFAULT_ADMIN_USERNAME;
            await adminExists.save();
        }
        logger_1.logger.info(`Admin user already exists: ${exports.DEFAULT_ADMIN_EMAIL}`);
        return 'exists';
    }
    const passwordHash = await bcryptjs_1.default.hash(exports.DEFAULT_ADMIN_PASSWORD, 12);
    await User_1.User.create({
        name: 'Admin User',
        email: exports.DEFAULT_ADMIN_EMAIL,
        username: exports.DEFAULT_ADMIN_USERNAME,
        passwordHash,
        role: enums_1.UserRole.ADMIN,
        status: enums_1.UserStatus.ACTIVE,
        isOnboarded: true,
    });
    logger_1.logger.info(`Admin user created: ${exports.DEFAULT_ADMIN_EMAIL} / ${exports.DEFAULT_ADMIN_PASSWORD}`);
    return 'created';
};
exports.ensureAdminUser = ensureAdminUser;
//# sourceMappingURL=ensureAdminUser.js.map