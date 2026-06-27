import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  TokenPayload,
} from '../utils/jwt';
import { AppError } from '../utils/response';
import { Response } from 'express';
import { UserStatus, UserRole } from '../types/enums';
import { logger } from '../config/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export class AuthService {
  private static buildTokenPayload(user: IUser): TokenPayload {
    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      customPermissions: user.role === UserRole.CUSTOM ? user.customPermissions : undefined,
    };
  }

  private static buildUserResponse(user: IUser) {
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

  static async login(identifier: string, password: string, res: Response, ip?: string) {
    const normalizedInput = identifier.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: normalizedInput }, { username: normalizedInput }],
      isDeleted: false,
    }).select('+passwordHash +refreshToken +failedLoginAttempts +lockUntil');

    if (user?.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      logger.warn('Login blocked — account locked', { identifier: normalizedInput, ip });
      throw new AppError(
        `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
        423,
      );
    }

    const isValidUser =
      user &&
      user.status === UserStatus.ACTIVE &&
      (await bcrypt.compare(password, user.passwordHash));

    if (!isValidUser) {
      if (user) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
          user.failedLoginAttempts = 0;
          logger.warn('Account locked after failed attempts', { identifier: normalizedInput, ip });
        }
        await user.save();
      }

      logger.warn('Failed login attempt', { identifier: normalizedInput, ip });
      throw new AppError('Invalid email/username or password', 401);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const payload = this.buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);
    logger.info('Successful login', { userId: user._id, email: user.email, ip });

    return { user: this.buildUserResponse(user) };
  }

  static async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401);
    }

    let decoded: ReturnType<typeof verifyRefreshToken>;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(res);
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken || user.isDeleted) {
      throw new AppError('Invalid refresh token', 401);
    }

    const payload = this.buildTokenPayload(user);
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);
    return { message: 'Token refreshed' };
  }

  static async logout(userId: string, res: Response) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  static async getMe(userId: string) {
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new AppError('User not found', 404);
    return this.buildUserResponse(user);
  }

  static async completeOnboarding(
    userId: string,
    data: { username: string; email: string; password: string },
    res: Response,
  ) {
    const user = await User.findOne({ _id: userId, isDeleted: false }).select(
      '+passwordHash +refreshToken',
    );
    if (!user) throw new AppError('User not found', 404);
    if (user.isOnboarded) throw new AppError('Onboarding already completed', 400);

    const usernameTaken = await User.findOne({
      username: data.username,
      _id: { $ne: userId },
      isDeleted: false,
    });
    if (usernameTaken) throw new AppError('Username is already taken', 409);

    const emailTaken = await User.findOne({
      email: data.email,
      _id: { $ne: userId },
      isDeleted: false,
    });
    if (emailTaken) throw new AppError('Email is already in use', 409);

    user.username = data.username;
    user.email = data.email;
    user.passwordHash = await bcrypt.hash(data.password, 12);
    user.isOnboarded = true;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const payload = this.buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);
    logger.info('Onboarding completed', { userId: user._id, username: user.username });

    return { user: this.buildUserResponse(user) };
  }
}
