import { UserRole } from '../types/enums';
import { AppError } from './response';

export const ADMIN_ONLY_PERMISSIONS = [
  'users:read',
  'users:*',
  'logs:read',
  'logs:*',
  'backup:read',
  'backup:*',
  'settings:read',
  'settings:*',
];

export const ALL_ASSIGNABLE_PERMISSIONS = [
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

export const validateCustomPermissions = (permissions: string[]): string[] => {
  const invalid = permissions.filter(
    (p) =>
      ADMIN_ONLY_PERMISSIONS.includes(p) ||
      (!ALL_ASSIGNABLE_PERMISSIONS.includes(p) && p !== '*'),
  );
  if (invalid.length > 0) {
    throw new AppError(`Invalid or admin-only permissions: ${invalid.join(', ')}`, 400);
  }
  return permissions;
};

export const resolveUserPermissions = (
  role: UserRole | string,
  customPermissions?: string[] | null,
): string[] => {
  if (role === UserRole.ADMIN) return ['*'];
  if (customPermissions?.length) return customPermissions;
  return [];
};
