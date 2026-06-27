export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  DELIVERY_STAFF = 'delivery_staff',
  CUSTOM = 'custom',
}

export enum CustomerStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum DeliveryStatus {
  DELIVERED = 'delivered',
  PENDING = 'pending',
  OVERDUE = 'overdue',
}

export enum ColorCode {
  WHITE = 'white',
  ORANGE = 'orange',
  RED = 'red',
}

export enum TransactionType {
  WALKIN = 'walkin',
  DELIVERY = 'delivery',
  POS = 'pos',
}

export enum PaymentMethod {
  CASH = 'cash',
  GCASH = 'gcash',
  BANK = 'bank',
}

export enum TransactionStatus {
  PAID = 'paid',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

export enum GallonType {
  SLIM = 'slim',
  ROUND = 'round',
}

export enum InventoryMovementType {
  PRODUCTION = 'production',
  DELIVERY = 'delivery',
  POS_SALE = 'pos_sale',
  WALKIN_SALE = 'walkin_sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
}

export enum ProductCategory {
  REFILL = 'refill',
  CONTAINER = 'container',
  RENTAL = 'rental',
  OTHER = 'other',
}

export enum ProductStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum NotificationType {
  OVERDUE_DELIVERY = 'overdue_delivery',
  DELIVERY_3DAY_LATE = 'delivery_3day_late',
  DELIVERY_CONTINUE_DECISION = 'delivery_continue_decision',
  LOW_INVENTORY = 'low_inventory',
  BACKUP_REMINDER = 'backup_reminder',
  PAYMENT_REMINDER = 'payment_reminder',
}

export enum ContinuationDecision {
  NONE = 'none',
  PENDING = 'pending',
  CONTINUED = 'continued',
  STOPPED = 'stopped',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.CASHIER]: [
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
  [UserRole.DELIVERY_STAFF]: [
    'dashboard:read',
    'customers:read',
    'deliveries:*',
    'gallons:*',
    'notifications:read',
    'collection:read',
  ],
  [UserRole.CUSTOM]: [],
};
