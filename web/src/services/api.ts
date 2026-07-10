import api from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Customer,
  Delivery,
  Transaction,
  InventoryItem,
  Product,
  InventoryMovement,
  ActivityLog,
  DashboardStats,
  Settings,
  Invoice,
  PricingTier,
  DailyCollection,
  GallonOverviewResponse,
  GallonHistoryEntry,
} from '@/types';

export const authApi = {
  login: (identifier: string, password: string) =>
    api.post<ApiResponse<{ user: User }>>('/auth/login', { identifier, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  onboarding: (data: { username: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/onboarding', data),
};

export const dashboardApi = {
  stats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  sales: (period: string, range = 'this-month') =>
    api.get<ApiResponse<Array<{ date: string; total: number; count: number }>>>('/dashboard/sales', {
      params: { period, range },
    }),
  deliveries: () => api.get<ApiResponse<{ total: number; breakdown: Array<{ name: string; value: number; color: string }> }>>('/dashboard/deliveries'),
  inventory: () =>
    api.get<
      ApiResponse<{
        slim: {
          inStock: number;
          lowStock: number;
          lowStockWarning?: boolean;
          containersOut?: number;
          containersReturned?: number;
          netContainersOut?: number;
        };
        round: {
          inStock: number;
          lowStock: number;
          lowStockWarning?: boolean;
          containersOut?: number;
          containersReturned?: number;
          netContainersOut?: number;
        };
        movementsToday?: number;
      }>
    >('/dashboard/inventory'),
  activity: (limit = 10) => api.get<ApiResponse<ActivityLog[]>>('/dashboard/activity', { params: { limit } }),
  topCustomers: (limit = 5) => api.get<ApiResponse<Array<{ fullName: string; totalSpent: number; orderCount: number }>>>('/dashboard/top-customers', { params: { limit } }),
  recentDeliveries: (limit = 5) => api.get<ApiResponse<Delivery[]>>('/dashboard/recent-deliveries', { params: { limit } }),
  recentTransactions: (limit = 5) => api.get<ApiResponse<Transaction[]>>('/dashboard/recent-transactions', { params: { limit } }),
  systemSummary: () =>
    api.get<
      ApiResponse<{
        totalUsers: number;
        totalProducts: number;
        totalInventoryItems: number;
        lowStockItems: number;
        movementsToday: number;
        outstandingSlim: number;
        outstandingRound: number;
        databaseConnected: boolean;
        databaseSize: string | null;
        databaseCollections: number;
        lastBackup: string | null;
        lastBackupFilename?: string | null;
        companyName: string;
        version: string;
      }>
    >('/dashboard/system-summary'),
};

export const healthApi = {
  check: () =>
    api.get<{
      success: boolean;
      message: string;
      database: 'connected' | 'disconnected';
      version: string;
      timestamp: string;
    }>('/health'),
};

export const customerApi = {
  list: (params: Record<string, unknown>) => api.get<PaginatedResponse<Customer>>('/customers', { params }),
  get: (id: string) => api.get<ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Partial<Customer>) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  toggleStatus: (id: string) => api.patch(`/customers/${id}/toggle-status`),
  import: (customers: Partial<Customer>[]) => api.post('/customers/import', { customers }),
  uploadPhoto: (id: string, formData: FormData) =>
    api.post<ApiResponse<Customer>>(`/customers/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePhoto: (id: string) => api.delete(`/customers/${id}/photo`),
};

export const deliveryApi = {
  list: (params: Record<string, unknown>) => api.get<PaginatedResponse<Delivery>>('/deliveries', { params }),
  get: (id: string) => api.get<ApiResponse<Delivery>>(`/deliveries/${id}`),
  create: (data: Partial<Delivery>) => api.post<ApiResponse<Delivery>>('/deliveries', data),
  update: (id: string, data: Partial<Delivery>) => api.put<ApiResponse<Delivery>>(`/deliveries/${id}`, data),
  delete: (id: string) => api.delete(`/deliveries/${id}`),
  calendar: (startDate: string, endDate: string) =>
    api.get<ApiResponse<Delivery[]>>('/deliveries/calendar', { params: { startDate, endDate } }),
  history: (params: Record<string, unknown>) => api.get<PaginatedResponse<Delivery>>('/deliveries/history', { params }),
  decision: (id: string, action: 'continue' | 'stop', rescheduleDate?: string) =>
    api.post(`/deliveries/${id}/decision`, { action, rescheduleDate }),
};

export const invoiceApi = {
  list: (params: Record<string, unknown>) => api.get<PaginatedResponse<Invoice>>('/invoices', { params }),
  get: (id: string) => api.get<ApiResponse<Invoice>>(`/invoices/${id}`),
  create: (data: Record<string, unknown>) => api.post('/invoices', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  convert: (id: string) => api.post(`/invoices/${id}/convert`),
};

/** @deprecated use invoiceApi — alias kept for transition */
export const waterOrderApi = invoiceApi;

export const pricingTierApi = {
  list: () => api.get<ApiResponse<PricingTier[]>>('/pricing-tiers'),
  update: (id: string, data: Partial<PricingTier>) => api.put<ApiResponse<PricingTier>>(`/pricing-tiers/${id}`, data),
};

export const collectionApi = {
  daily: (date?: string) => api.get<ApiResponse<DailyCollection>>('/collection/daily', { params: { date } }),
};

export const transactionApi = {
  list: (params: Record<string, unknown>) => api.get<PaginatedResponse<Transaction>>('/transactions', { params }),
  get: (id: string) => api.get<ApiResponse<Transaction>>(`/transactions/${id}`),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<Transaction>>('/transactions', data),
  update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

export const gallonApi = {
  overview: () => api.get<ApiResponse<GallonOverviewResponse>>('/gallons'),
  recordOut: (data: Record<string, unknown>) => api.post('/gallons/out', data),
  recordReturn: (data: Record<string, unknown>) => api.post('/gallons/return', data),
  history: (itemKey?: string) => api.get<ApiResponse<GallonHistoryEntry[]>>('/gallons/history', { params: { itemKey } }),
};

export const inventoryApi = {
  list: (params: Record<string, unknown>) => api.get<PaginatedResponse<InventoryItem>>('/inventory', { params }),
  get: (id: string) => api.get<ApiResponse<InventoryItem>>(`/inventory/${id}`),
  create: (data: Partial<InventoryItem>) => api.post<ApiResponse<InventoryItem>>('/inventory', data),
  update: (id: string, data: Partial<InventoryItem>) => api.put<ApiResponse<InventoryItem>>(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  addProduction: (id: string, data: { quantity: number; remarks: string }) =>
    api.post(`/inventory/${id}/production`, data),
  manualAdjust: (id: string, data: { quantity: number; reason: string }) =>
    api.post(`/inventory/${id}/adjust`, data),
  movements: (params: Record<string, unknown>) =>
    api.get<PaginatedResponse<InventoryMovement>>('/inventory-movements', { params }),
};

export const productApi = {
  list: (params?: Record<string, unknown>) => api.get<PaginatedResponse<Product>>('/products', { params }),
  active: () => api.get<ApiResponse<Product[]>>('/products/active'),
  get: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<ApiResponse<Product>>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<ApiResponse<Product>>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const reportApi = {
  sales: (startDate: string, endDate: string, groupBy: 'daily' | 'weekly' | 'monthly' = 'daily') =>
    api.get('/reports/sales', { params: { startDate, endDate, groupBy } }),
  deliveries: (startDate: string, endDate: string) => api.get('/reports/deliveries', { params: { startDate, endDate } }),
  customers: () => api.get('/reports/customers'),
  inventory: (startDate?: string, endDate?: string) =>
    api.get('/reports/inventory', { params: { startDate, endDate } }),
};

export const userApi = {
  list: (params: Record<string, unknown>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<{ user: User; tempPassword: string }>>('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  updatePermissions: (id: string, customPermissions: string[]) =>
    api.put(`/users/${id}/permissions`, { customPermissions }),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const notificationApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const logApi = {
  list: (params: Record<string, unknown>) => api.get<PaginatedResponse<ActivityLog>>('/logs', { params }),
};

export const backupApi = {
  list: () => api.get('/backups'),
  create: () => api.post('/backups'),
  download: (id: string) => api.get(`/backups/${id}/download`, { responseType: 'blob' }),
};

export const settingsApi = {
  get: () => api.get<ApiResponse<Settings>>('/settings'),
  update: (data: Partial<Settings>) => api.put<ApiResponse<Settings>>('/settings', data),
};

export const searchApi = {
  global: (q: string) => api.get('/search', { params: { q } }),
};
