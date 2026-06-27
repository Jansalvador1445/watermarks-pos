import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getLogs,
  getBackups,
  createBackup,
  downloadBackup,
  getSettings,
  updateSettings,
  globalSearch,
} from '../controllers/userController';
import { authenticate } from '../middlewares/auth';
import { authorize, authorizeRoles } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createUserSchema, updateUserSchema, updateSettingsSchema, updatePermissionsSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';
import { UserRole } from '../types/enums';

const userRouter = Router();
userRouter.use(authenticate);
userRouter.get('/', authorizeRoles(UserRole.ADMIN), getUsers);
userRouter.get('/:id', authorizeRoles(UserRole.ADMIN), getUser);
userRouter.post('/', authorizeRoles(UserRole.ADMIN), validate(createUserSchema), auditLog('users', 'create'), createUser);
userRouter.put('/:id', authorizeRoles(UserRole.ADMIN), validate(updateUserSchema), auditLog('users', 'update'), updateUser);
userRouter.put('/:id/permissions', authorizeRoles(UserRole.ADMIN), validate(updatePermissionsSchema), auditLog('users', 'update-permissions'), updateUserPermissions);
userRouter.delete('/:id', authorizeRoles(UserRole.ADMIN), auditLog('users', 'delete'), deleteUser);

const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get('/', authorize('notifications:read'), getNotifications);
notificationRouter.patch('/:id/read', authorize('notifications:read'), markNotificationRead);
notificationRouter.patch('/read-all', authorize('notifications:read'), markAllNotificationsRead);

const logRouter = Router();
logRouter.use(authenticate);
logRouter.get('/', authorizeRoles(UserRole.ADMIN), getLogs);

const backupRouter = Router();
backupRouter.use(authenticate);
backupRouter.get('/', authorizeRoles(UserRole.ADMIN), getBackups);
backupRouter.post('/', authorizeRoles(UserRole.ADMIN), auditLog('backups', 'create'), createBackup);
backupRouter.get('/:id/download', authorizeRoles(UserRole.ADMIN), downloadBackup);

const settingsRouter = Router();
settingsRouter.use(authenticate);
settingsRouter.get('/', getSettings);
settingsRouter.put('/', authorizeRoles(UserRole.ADMIN), validate(updateSettingsSchema), auditLog('settings', 'update'), updateSettings);

const searchRouter = Router();
searchRouter.use(authenticate);
searchRouter.get('/', globalSearch);

export { userRouter, notificationRouter, logRouter, backupRouter, settingsRouter, searchRouter };
