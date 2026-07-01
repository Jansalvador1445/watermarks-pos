export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Water Refilling Station POS';

export const PRIMARY_COLOR = '#1677FF';
export const BG_COLOR = '#F5F7FA';
export const CARD_RADIUS = 16;
export const SPACING = 24;
export const SIDEBAR_WIDTH = 260;
export const HEADER_HEIGHT = 72;

export const SCHEDULE_OPTIONS = [
  'Daily',
  'Every 2 Days',
  'Every 3 Days',
  'Weekly',
  'Bi-weekly',
  'Monthly',
];

export const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'GCash', value: 'gcash' },
  { label: 'Bank Transfer', value: 'bank' },
];

export const TRANSACTION_TYPES = [
  { label: 'Walk-in', value: 'walkin' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'POS', value: 'pos' },
];

export const USER_ROLES = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Cashier / Finance', value: 'cashier' },
  { label: 'Delivery Staff', value: 'delivery_staff' },
  { label: 'Custom Role', value: 'custom' },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  cashier: [
    'dashboard:read',
    'customers:read',
    'transactions:*',
    'pos:*',
    'inventory:read',
    'notifications:read',
    'orders:*',
    'collection:read',
    'reports:read',
  ],
  delivery_staff: [
    'dashboard:read',
    'customers:read',
    'deliveries:*',
    'gallons:*',
    'notifications:read',
    'collection:read',
  ],
  custom: [],
};

export interface MenuItemDef {
  key: string;
  label: string;
  icon: string;
  permission: string;
}

export interface MenuGroupDef {
  key: string;
  label: string;
  items: MenuItemDef[];
}

/** Sidebar navigation — grouped by purpose for easy scanning */
export const MENU_GROUPS: MenuGroupDef[] = [
  {
    key: 'overview',
    label: 'Overview',
    items: [
      { key: '/dashboard', label: 'Dashboard', icon: 'DashboardOutlined', permission: 'dashboard:read' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers & Orders',
    items: [
      { key: '/customers', label: 'Customers', icon: 'TeamOutlined', permission: 'customers:read' },
      { key: '/water-orders', label: 'Invoices', icon: 'FileTextOutlined', permission: 'orders:read' },
    ],
  },
  {
    key: 'deliveries',
    label: 'Deliveries',
    items: [
      { key: '/deliveries', label: 'Delivery Schedule', icon: 'CarOutlined', permission: 'deliveries:read' },
      { key: '/delivered-history', label: 'Delivered History', icon: 'CheckCircleOutlined', permission: 'deliveries:read' },
    ],
  },
  {
    key: 'sales',
    label: 'Sales & Collection',
    items: [
      { key: '/pos', label: 'POS (Sales)', icon: 'ShoppingCartOutlined', permission: 'pos:*' },
      { key: '/transactions', label: 'Transactions', icon: 'TransactionOutlined', permission: 'transactions:read' },
      { key: '/daily-collection', label: 'Daily Collection', icon: 'DollarOutlined', permission: 'collection:read' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory & Stock',
    items: [
      { key: '/gallons', label: 'Item Tracking', icon: 'ExperimentOutlined', permission: 'gallons:read' },
      { key: '/inventory', label: 'Inventory', icon: 'InboxOutlined', permission: 'inventory:read' },
    ],
  },
  {
    key: 'insights',
    label: 'Reports & Alerts',
    items: [
      { key: '/reports', label: 'Reports', icon: 'BarChartOutlined', permission: 'reports:read' },
      { key: '/notifications', label: 'Notifications', icon: 'BellOutlined', permission: 'notifications:read' },
    ],
  },
  {
    key: 'system',
    label: 'System & Admin',
    items: [
      { key: '/users', label: 'Users', icon: 'UserOutlined', permission: 'users:read' },
      { key: '/logs', label: 'Activity Logs', icon: 'HistoryOutlined', permission: 'logs:read' },
      { key: '/backup', label: 'Backup & Restore', icon: 'CloudUploadOutlined', permission: 'backup:read' },
      { key: '/settings', label: 'Settings', icon: 'SettingOutlined', permission: 'settings:read' },
    ],
  },
];

/** @deprecated Use MENU_GROUPS — kept for any legacy imports */
export const MENU_ITEMS = MENU_GROUPS.flatMap((g) => g.items);
