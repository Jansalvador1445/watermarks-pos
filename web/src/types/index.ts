export const UserRole = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  DELIVERY_STAFF: 'delivery_staff',
  CUSTOM: 'custom',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  avatar?: string;
  status?: string;
  isOnboarded?: boolean;
  lastLogin?: string;
  customPermissions?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerContact {
  name: string;
  position?: string;
  mobile: string;
  email?: string;
}

export interface PricingTier {
  _id: string;
  code: string;
  label: string;
  slimPrice: number;
  roundPrice: number;
}

export interface Customer {
  _id: string;
  fullName: string;
  address: string;
  phone: string;
  pricingCategory: PricingTier | string;
  latitude?: number;
  longitude?: number;
  manualLocation?: string;
  locationNotes?: string;
  mapsUrl?: string;
  /** @deprecated legacy field */
  addressLink?: string;
  propertyPhoto?: string;
  propertyPhotoUrl?: string;
  contacts: CustomerContact[];
  outstandingSlim?: number;
  outstandingRound?: number;
  status: 'enabled' | 'disabled';
  createdAt: string;
}

export interface Delivery {
  _id: string;
  customerId: Customer | string;
  date: string;
  schedule: string;
  status: 'delivered' | 'pending' | 'overdue';
  colorCode: 'white' | 'orange' | 'red';
  remarks?: string;
  discount: number;
  paid: boolean;
  slimOut: number;
  roundOut: number;
  slimIn: number;
  roundIn: number;
  slimReturn: number;
  roundReturn: number;
  rescheduleDate?: string;
  assignedStaffId?: User | string;
}

export interface InvoiceItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Invoice {
  _id: string;
  invoiceNo: string;
  customerId: Customer | string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'gcash' | 'bank';
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  createdBy?: User | string;
  deliveryId?: string;
  createdAt: string;
}

/** @deprecated use Invoice */
export type WaterOrder = Invoice;

export interface DailyCollectionItem {
  id: string;
  customer: string;
  amount: number;
  paymentMethod: string;
  paid: boolean;
  type: string;
  source: 'transaction' | 'delivery';
  staff?: string;
  createdAt: string;
}

export interface DailyCollection {
  date: string;
  summary: { cash: number; gcash: number; bank: number; total: number };
  unpaidTotal: number;
  items: DailyCollectionItem[];
}

export interface Transaction {
  _id: string;
  type: 'walkin' | 'delivery' | 'pos';
  invoiceNo: string;
  customerId?: Customer | string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    gallonType?: string;
    decrementsStock?: boolean;
    productId?: string;
  }>;
  paymentMethod: 'cash' | 'gcash' | 'bank';
  amount: number;
  discount: number;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface InventoryItem {
  _id: string;
  publicId: string;
  name: string;
  sku?: string;
  unit: string;
  category: string;
  price: number;
  description?: string;
  refillType?: 'slim' | 'round';
  currentStock: number;
  lowStockThreshold: number;
  borrowed: number;
  returned: number;
}

export interface Product {
  _id: string;
  name: string;
  /** Retail price (Tier A) */
  price: number;
  purchasePrice?: number;
  tierBPrice?: number;
  tierCPrice?: number;
  gallonType?: 'slim' | 'round';
  category: 'refill' | 'container' | 'rental' | 'other';
  decrementsStock: boolean;
  linkedInventoryId?: string;
  linkedInventory?: {
    _id: string;
    name: string;
    category?: string;
    unit?: string;
    currentStock?: number;
    lowStockThreshold?: number;
  };
  status: 'active' | 'disabled';
}

export interface InventoryMovement {
  _id: string;
  date: string;
  itemId: { _id: string; name: string } | string;
  movementType: 'production' | 'delivery' | 'pos_sale' | 'walkin_sale' | 'invoice_sale' | 'return' | 'adjustment';
  quantity: number;
  beforeStock: number;
  afterStock: number;
  referenceNo: string;
  userId: { _id: string; name: string; email: string } | string;
  remarks?: string;
  createdAt: string;
}

export interface TrackedContainerItem {
  itemKey: string;
  label: string;
  type?: 'slim' | 'round';
  currentIn: number;
  currentOut: number;
  returned: number;
}

export interface GallonOverviewResponse {
  items: TrackedContainerItem[];
  slim: TrackedContainerItem;
  round: TrackedContainerItem;
}

export interface GallonOverview extends TrackedContainerItem {
  type?: 'slim' | 'round';
}

export interface GallonHistoryEntry {
  _id: string;
  itemKey: string;
  label: string;
  type?: 'slim' | 'round';
  direction: 'out' | 'return';
  quantity: number;
  date: string;
  remarks?: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    deliveryId?: string;
    customerName?: string;
    daysLate?: number;
    scheduledDate?: string;
    actionRequired?: string;
    colorCode?: string;
    count?: number;
    summaryKey?: string;
  };
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  userId?: { name: string; role: string; avatar?: string };
  action: string;
  module: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  todayDeliveries: number;
  deliveredToday: number;
  pendingToday: number;
  overdueDeliveries: number;
  overdue2Days: number;
  overdue3Plus: number;
  todaySales: number;
  salesGrowth: number;
  monthSales: number;
  monthGrowth: number;
}

export interface Settings {
  companyName: string;
  logo?: string;
  pricing: { defaultSlimPrice: number; defaultRoundPrice: number };
  deliveryRules: { overdueDaysOrange: number; overdueDaysRed: number };
  notificationSettings: {
    overdueDelivery: boolean;
    lowInventory: boolean;
    backupReminder: boolean;
    paymentReminder: boolean;
  };
  theme: string;
}
