import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
import { AppError } from '../utils/response';
import { ROLE_PERMISSIONS, UserRole } from '../types/enums';

const matchPermission = (userPerms: string[], required: string): boolean => {
  return userPerms.some((perm) => {
    if (perm === '*') return true;
    if (perm === required) return true;
    const [module, action] = perm.split(':');
    const [reqModule, reqAction] = required.split(':');
    return module === reqModule && action === '*';
  });
};

const getUserPermissions = (req: AuthRequest): string[] => {
  const role = req.user!.role as UserRole;
  if (role === UserRole.ADMIN) return ['*'];
  if (req.user!.customPermissions?.length) return req.user!.customPermissions;
  return ROLE_PERMISSIONS[role] || [];
};

export const authorize =
  (...permissions: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userPerms = getUserPermissions(req);
    const hasPermission = permissions.some((p) => matchPermission(userPerms, p));

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };

export const authorizeRoles =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
