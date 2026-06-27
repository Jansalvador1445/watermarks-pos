export const ADMIN_ONLY_MODULES = ['users', 'logs', 'backup', 'settings'] as const;

export interface PermissionModule {
  key: string;
  label: string;
  viewPermission?: string;
  managePermission?: string;
  viewOnly?: boolean;
  manageOnly?: boolean;
  adminOnly?: boolean;
}

export type PermissionModuleState = { view: boolean; manage: boolean };

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'dashboard', label: 'Dashboard', viewPermission: 'dashboard:read', viewOnly: true },
  { key: 'customers', label: 'Customers', viewPermission: 'customers:read', managePermission: 'customers:*' },
  { key: 'deliveries', label: 'Deliveries', viewPermission: 'deliveries:read', managePermission: 'deliveries:*' },
  { key: 'orders', label: 'Invoices', viewPermission: 'orders:read', managePermission: 'orders:*' },
  { key: 'transactions', label: 'Transactions', viewPermission: 'transactions:read', managePermission: 'transactions:*' },
  { key: 'pos', label: 'POS Sales', managePermission: 'pos:*', manageOnly: true },
  { key: 'gallons', label: 'Item Tracking', viewPermission: 'gallons:read', managePermission: 'gallons:*' },
  { key: 'inventory', label: 'Inventory', viewPermission: 'inventory:read', managePermission: 'inventory:*' },
  { key: 'reports', label: 'Reports', viewPermission: 'reports:read', viewOnly: true },
  { key: 'notifications', label: 'Notifications', viewPermission: 'notifications:read', viewOnly: true },
  { key: 'collection', label: 'Daily Collection', viewPermission: 'collection:read', viewOnly: true },
  { key: 'delivered-history', label: 'Delivered History', viewPermission: 'deliveries:read', viewOnly: true },
  { key: 'users', label: 'User Management', viewPermission: 'users:read', managePermission: 'users:*', adminOnly: true },
  { key: 'logs', label: 'Activity Logs', viewPermission: 'logs:read', managePermission: 'logs:*', adminOnly: true },
  { key: 'backup', label: 'Backup & Restore', viewPermission: 'backup:read', managePermission: 'backup:*', adminOnly: true },
  { key: 'settings', label: 'Settings', viewPermission: 'settings:read', managePermission: 'settings:*', adminOnly: true },
];

export const matchPermission = (userPerms: string[], required: string): boolean => {
  return userPerms.some((perm) => {
    if (perm === '*') return true;
    if (perm === required) return true;
    const [module, action] = perm.split(':');
    const [reqModule] = required.split(':');
    return module === reqModule && action === '*';
  });
};

/** Convert checkbox grid state → permission strings */
export const buildPermissionsFromState = (
  state: Record<string, PermissionModuleState>,
): string[] => {
  const perms: string[] = [];
  PERMISSION_MODULES.forEach((mod) => {
    if (mod.adminOnly) return;
    const s = state[mod.key];
    if (!s) return;
    if (s.view && mod.viewPermission) perms.push(mod.viewPermission);
    if (s.manage && mod.managePermission) perms.push(mod.managePermission);
  });
  return [...new Set(perms)];
};

/** Convert permission strings → checkbox grid state */
export const buildStateFromPermissions = (
  permissions: string[],
): Record<string, PermissionModuleState> => {
  const result: Record<string, PermissionModuleState> = {};
  PERMISSION_MODULES.forEach((mod) => {
    result[mod.key] = {
      view: mod.viewPermission ? matchPermission(permissions, mod.viewPermission) : false,
      manage: mod.managePermission ? matchPermission(permissions, mod.managePermission) : false,
    };
  });
  return result;
};

export const countEnabledPermissions = (state: Record<string, PermissionModuleState>): number => {
  return buildPermissionsFromState(state).length;
};

export const getRolePermissionSummary = (
  role: string,
  rolePermissions: Record<string, string[]>,
): string[] => {
  if (role === 'admin') return ['Full system access'];
  const perms = rolePermissions[role] || [];
  if (perms.length === 0) return ['No default permissions'];
  return PERMISSION_MODULES.filter((mod) => {
    if (mod.adminOnly) return false;
    const view = mod.viewPermission && matchPermission(perms, mod.viewPermission);
    const manage = mod.managePermission && matchPermission(perms, mod.managePermission);
    return view || manage;
  }).map((mod) => {
    const manage = mod.managePermission && matchPermission(perms, mod.managePermission);
    return `${mod.label}${manage ? ' (Manage)' : ' (View)'}`;
  });
};
