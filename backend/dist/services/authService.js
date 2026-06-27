"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const enums_1 = require("../types/enums");
const logger_1 = require("../config/logger");
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
class AuthService {
    static buildTokenPayload(user) {
        return {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            isOnboarded: user.isOnboarded,
            customPermissions: user.role === enums_1.UserRole.CUSTOM ? user.customPermissions : undefined,
        };
    }
    static buildUserResponse(user) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            status: user.status,
            isOnboarded: user.isOnboarded,
            customPermissions: user.customPermissions,
            lastLogin: user.lastLogin,
        };
    }
    static async login(identifier, password, res, ip) {
        const normalizedInput = identifier.toLowerCase().trim();
        const user = await User_1.User.findOne({
            $or: [{ email: normalizedInput }, { username: normalizedInput }],
            isDeleted: false,
        }).select('+passwordHash +refreshToken +failedLoginAttempts +lockUntil');
        if (user?.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            logger_1.logger.warn('Login blocked — account locked', { identifier: normalizedInput, ip });
            throw new response_1.AppError(`Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`, 423);
        }
        const isValidUser = user &&
            user.status === enums_1.UserStatus.ACTIVE &&
            (await bcryptjs_1.default.compare(password, user.passwordHash));
        if (!isValidUser) {
            if (user) {
                user.failedLoginAttempts += 1;
                if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                    user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                    user.failedLoginAttempts = 0;
                    logger_1.logger.warn('Account locked after failed attempts', { identifier: normalizedInput, ip });
                }
                await user.save();
            }
            logger_1.logger.warn('Failed login attempt', { identifier: normalizedInput, ip });
            throw new response_1.AppError('Invalid email/username or password', 401);
        }
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        const payload = this.buildTokenPayload(user);
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        (0, jwt_1.setAuthCookies)(res, accessToken, refreshToken);
        logger_1.logger.info('Successful login', { userId: user._id, email: user.email, ip });
        return { user: this.buildUserResponse(user) };
    }
    static async refresh(refreshToken, res) {
        if (!refreshToken) {
            throw new response_1.AppError('Refresh token required', 401);
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            (0, jwt_1.clearAuthCookies)(res);
            throw new response_1.AppError('Invalid refresh token', 401);
        }
        const user = await User_1.User.findById(decoded.userId).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken || user.isDeleted) {
            throw new response_1.AppError('Invalid refresh token', 401);
        }
        const payload = this.buildTokenPayload(user);
        const newAccessToken = (0, jwt_1.generateAccessToken)(payload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(payload);
        user.refreshToken = newRefreshToken;
        await user.save();
        (0, jwt_1.setAuthCookies)(res, newAccessToken, newRefreshToken);
        return { message: 'Token refreshed' };
    }
    static async logout(userId, res) {
        await User_1.User.findByIdAndUpdate(userId, { refreshToken: null });
        (0, jwt_1.clearAuthCookies)(res);
        return { message: 'Logged out successfully' };
    }
    static async getMe(userId) {
        const user = await User_1.User.findOne({ _id: userId, isDeleted: false });
        if (!user)
            throw new response_1.AppError('User not found', 404);
        return this.buildUserResponse(user);
    }
    static async completeOnboarding(userId, data, res) {
        const user = await User_1.User.findOne({ _id: userId, isDeleted: false }).select('+passwordHash +refreshToken');
        if (!user)
            throw new response_1.AppError('User not found', 404);
        if (user.isOnboarded)
            throw new response_1.AppError('Onboarding already completed', 400);
        const usernameTaken = await User_1.User.findOne({
            username: data.username,
            _id: { $ne: userId },
            isDeleted: false,
        });
        if (usernameTaken)
            throw new response_1.AppError('Username is already taken', 409);
        const emailTaken = await User_1.User.findOne({
            email: data.email,
            _id: { $ne: userId },
            isDeleted: false,
        });
        if (emailTaken)
            throw new response_1.AppError('Email is already in use', 409);
        user.username = data.username;
        user.email = data.email;
        user.passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        user.isOnboarded = true;
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        const payload = this.buildTokenPayload(user);
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        user.refreshToken = refreshToken;
        await user.save();
        (0, jwt_1.setAuthCookies)(res, accessToken, refreshToken);
        logger_1.logger.info('Onboarding completed', { userId: user._id, username: user.username });
        return { user: this.buildUserResponse(user) };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map