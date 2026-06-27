import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { User } from '../models/User';
import { Notification, Log, Backup, Settings } from '../models/Notification';
import { AppError } from '../utils/response';
import { getPagination, buildSearchQuery } from '../utils/pagination';
import { NotificationType, UserRole } from '../types/enums';
import { validateCustomPermissions } from '../utils/permissions';
import { generateTempPassword } from '../utils/generatePassword';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { env } from '../config/env';

export class UserService {
  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { search, role, status } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (role) filter.role = role;
    if (status) filter.status = status;
    Object.assign(filter, buildSearchQuery(search as string, ['name', 'email', 'username']));

    const [data, total] = await Promise.all([
      User.find(filter).select('-passwordHash -refreshToken').sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  static async getById(id: string) {
    const user = await User.findOne({ _id: id, isDeleted: false }).select('-passwordHash -refreshToken');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async create(data: Record<string, unknown>) {
    const existing = await User.findOne({ email: (data.email as string).toLowerCase().trim() });
    if (existing) throw new AppError('Email already exists', 409);

    if (data.role === UserRole.CUSTOM) {
      if (!Array.isArray(data.customPermissions) || data.customPermissions.length === 0) {
        throw new AppError('Custom role requires at least one permission', 400);
      }
      validateCustomPermissions(data.customPermissions as string[]);
    } else {
      delete data.customPermissions;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
      ...data,
      email: (data.email as string).toLowerCase().trim(),
      passwordHash,
      isOnboarded: false,
    });

    const safeUser = await User.findById(user._id).select('-passwordHash -refreshToken');
    return { user: safeUser, tempPassword };
  }

  static async update(id: string, data: Record<string, unknown>) {
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password as string, 12);
      delete data.password;
    }

    const role = data.role as UserRole | undefined;
    const unset: Record<string, 1> = {};

    if (role && role !== UserRole.CUSTOM) {
      unset.customPermissions = 1;
      delete data.customPermissions;
    }

    if (role === UserRole.CUSTOM || data.customPermissions) {
      const perms = data.customPermissions as string[] | undefined;
      if (!perms?.length) throw new AppError('Custom role requires at least one permission', 400);
      validateCustomPermissions(perms);
    }

    const updateOps: Record<string, unknown> = { $set: data };
    if (Object.keys(unset).length > 0) updateOps.$unset = unset;

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateOps,
      { new: true, runValidators: true },
    ).select('-passwordHash -refreshToken');

    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async updatePermissions(id: string, customPermissions: string[]) {
    validateCustomPermissions(customPermissions);

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false, role: { $ne: UserRole.ADMIN } },
      { role: UserRole.CUSTOM, customPermissions },
      { new: true, runValidators: true },
    ).select('-passwordHash -refreshToken');

    if (!user) throw new AppError('User not found or cannot modify admin permissions', 404);
    return user;
  }

  static async delete(id: string) {
    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export class NotificationService {
  static async getAll(req: Request, userId?: string) {
    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (userId) filter.$or = [{ userId }, { userId: { $exists: false } }];

    const [data, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    return { data, pagination: { page, limit, total }, unreadCount };
  }

  static async markAsRead(id: string) {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  static async markAllAsRead(userId?: string) {
    const filter: Record<string, unknown> = { isRead: false };
    if (userId) filter.userId = userId;
    await Notification.updateMany(filter, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  static async create(data: { type: NotificationType; title: string; message: string; userId?: string; metadata?: Record<string, unknown> }) {
    return Notification.create(data);
  }
}

export class LogService {
  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { search, module, startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    if (module) filter.module = module;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    if (search) {
      filter.$or = [{ action: new RegExp(search as string, 'i') }, { module: new RegExp(search as string, 'i') }];
    }

    const [data, total] = await Promise.all([
      Log.find(filter).populate('userId', 'name role avatar').sort(sort).skip(skip).limit(limit).lean(),
      Log.countDocuments(filter),
    ]);

    return { data, pagination: { page, limit, total } };
  }
}

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

export class BackupService {
  static async getAll() {
    return Backup.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).lean();
  }

  static async getLatest() {
    return Backup.findOne().sort({ createdAt: -1 }).select('createdAt filename size');
  }

  static async create(userId: string) {
    const backupDir = path.join(process.cwd(), env.BACKUP_DIR);
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);

    const collections: Record<string, unknown[]> = {};
    const db = mongoose.connection.db;

    if (db) {
      for (const name of BACKUP_COLLECTIONS) {
        try {
          const docs = await db.collection(name).find({}).toArray();
          collections[name] = docs;
        } catch {
          collections[name] = [];
        }
      }
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      collections,
    };

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    const stats = fs.statSync(filepath);

    return Backup.create({
      filename,
      size: stats.size,
      createdBy: userId,
    });
  }

  static async download(id: string) {
    const backup = await Backup.findById(id);
    if (!backup) throw new AppError('Backup not found', 404);
    const filepath = path.join(process.cwd(), env.BACKUP_DIR, backup.filename);
    if (!fs.existsSync(filepath)) throw new AppError('Backup file not found', 404);
    return { filepath, filename: backup.filename };
  }
}

export class SettingsService {
  static async get() {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return settings;
  }

  static async update(data: Record<string, unknown>) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    return settings;
  }
}
