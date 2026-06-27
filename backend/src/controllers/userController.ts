import { Request, Response } from 'express';
import {
  UserService,
  NotificationService,
  LogService,
  BackupService,
  SettingsService,
} from '../services/userService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { AuthRequest } from '../types/express.d';
import { UserRole } from '../types/enums';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.getById(getParamId(req));
  return successResponse(res, data);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.create(req.body);
  return successResponse(res, data, 'User created', 201);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.update(getParamId(req), req.body);
  return successResponse(res, data, 'User updated');
});

export const updateUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.updatePermissions(getParamId(req), req.body.customPermissions);
  return successResponse(res, data, 'User permissions updated');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await UserService.delete(getParamId(req));
  return successResponse(res, null, 'User deleted');
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await NotificationService.getAll(req, req.user?.userId);
  return successResponse(res, result);
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotificationService.markAsRead(getParamId(req));
  return successResponse(res, data);
});

export const markAllNotificationsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await NotificationService.markAllAsRead(req.user?.userId);
  return successResponse(res, data);
});

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await LogService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getBackups = asyncHandler(async (_req: Request, res: Response) => {
  const data = await BackupService.getAll();
  return successResponse(res, data);
});

export const createBackup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await BackupService.create(req.user!.userId);
  return successResponse(res, data, 'Backup created', 201);
});

export const downloadBackup = asyncHandler(async (req: Request, res: Response) => {
  const { filepath, filename } = await BackupService.download(getParamId(req));
  return res.download(filepath, filename);
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await SettingsService.get();
  return successResponse(res, data);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await SettingsService.update(req.body);
  return successResponse(res, data, 'Settings updated');
});

export const globalSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return successResponse(res, { customers: [], transactions: [], deliveries: [], users: [] });
  }

  const { Customer, Delivery } = await import('../models/Customer');
  const { Transaction } = await import('../models/Transaction');
  const { User } = await import('../models/User');
  const { escapeRegex } = await import('../utils/pagination');
  const term = q.trim();
  if (term.length < 2) {
    return successResponse(res, { customers: [], transactions: [], deliveries: [], users: [] });
  }

  const regex = new RegExp(escapeRegex(term), 'i');
  const isAdmin = req.user?.role === UserRole.ADMIN;

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

  return successResponse(res, { customers, transactions, deliveries, users });
});
