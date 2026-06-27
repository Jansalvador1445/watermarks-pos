import { z } from 'zod';
import { UserRole } from '../types/enums';
import { ALL_ASSIGNABLE_PERMISSIONS, ADMIN_ONLY_PERMISSIONS } from '../utils/permissions';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Enter your email or username')
    .max(255)
    .transform((value) => value.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username is too long')
    .regex(/^[a-z0-9._-]+$/, 'Username can only contain lowercase letters, numbers, dots, dashes, and underscores')
    .transform((value) => value.toLowerCase().trim()),
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .transform((value) => value.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum([UserRole.ADMIN, UserRole.CASHIER, UserRole.DELIVERY_STAFF, UserRole.CUSTOM]),
  status: z.enum(['active', 'inactive']).optional(),
  customPermissions: z.array(z.string()).optional(),
});

export const updateUserSchema = createUserSchema.partial();

const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  position: z.string().optional(),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

const customerFieldsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  pricingCategory: z.string().min(1, 'Pricing category is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  manualLocation: z.string().max(500).optional().or(z.literal('')),
  locationNotes: z.string().max(500).optional().or(z.literal('')),
  contacts: z.array(contactSchema).optional(),
  status: z.enum(['enabled', 'disabled']).optional(),
});

const customerCoordinatePair = (data: {
  latitude?: number;
  longitude?: number;
}) =>
  (data.latitude == null && data.longitude == null) ||
  (data.latitude != null && data.longitude != null);

export const createCustomerSchema = customerFieldsSchema.refine(customerCoordinatePair, {
  message: 'Both latitude and longitude are required when setting a map pin',
  path: ['longitude'],
});

export const updateCustomerSchema = customerFieldsSchema.partial().refine(customerCoordinatePair, {
  message: 'Both latitude and longitude are required when setting a map pin',
  path: ['longitude'],
});

export const createDeliverySchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  schedule: z.string().min(1, 'Schedule is required'),
  status: z.enum(['delivered', 'pending', 'overdue']).optional(),
  colorCode: z.enum(['white', 'orange', 'red']).optional(),
  remarks: z.string().optional(),
  discount: z.number().min(0).optional(),
  paid: z.boolean().optional(),
  slimOut: z.number().min(0).optional(),
  roundOut: z.number().min(0).optional(),
  slimIn: z.number().min(0).optional(),
  roundIn: z.number().min(0).optional(),
  slimReturn: z.number().min(0).optional(),
  roundReturn: z.number().min(0).optional(),
  rescheduleDate: z.string().optional(),
  assignedStaffId: z.string().optional(),
});

export const updateDeliverySchema = createDeliverySchema.partial();

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

const catalogTransactionItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).max(1000),
});

const manualTransactionItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(1000),
  price: z.number().min(0).max(1_000_000),
  gallonType: z.enum(['slim', 'round']).optional(),
});

const transactionBaseSchema = z.object({
  customerId: objectIdSchema.optional(),
  customerName: z.string().max(200).optional(),
  paymentMethod: z.enum(['cash', 'gcash', 'bank']),
  discount: z.number().min(0).max(1_000_000).optional(),
  notes: z.string().max(500).optional(),
});

export const createTransactionSchema = z.discriminatedUnion('type', [
  transactionBaseSchema.extend({
    type: z.literal('pos'),
    items: z.array(catalogTransactionItemSchema).min(1, 'At least one item is required'),
  }),
  transactionBaseSchema.extend({
    type: z.literal('walkin'),
    items: z.array(catalogTransactionItemSchema).min(1, 'At least one item is required'),
  }),
  transactionBaseSchema.extend({
    type: z.literal('delivery'),
    items: z.array(manualTransactionItemSchema).min(1, 'At least one item is required'),
  }),
]);

export const updateTransactionSchema = z.object({
  notes: z.string().max(500).optional(),
});

const gallonItemRefSchema = z
  .object({
    itemKey: z.string().min(1).max(80).optional(),
    label: z.string().min(1).max(120).optional(),
    type: z.enum(['slim', 'round']).optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    remarks: z.string().optional(),
  })
  .refine((data) => !!(data.itemKey || data.label || data.type), {
    message: 'Item is required (select existing or enter a container name)',
  });

export const recordGallonOutSchema = gallonItemRefSchema;
export const recordGallonReturnSchema = gallonItemRefSchema;

/** @deprecated use recordGallonOutSchema / recordGallonReturnSchema */
export const createGallonSchema = z.object({
  type: z.enum(['slim', 'round']),
  action: z.enum(['out', 'return']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  remarks: z.string().optional(),
});

export const createInventorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unit is required').default('pcs'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
  lowStockThreshold: z.number().min(0).optional(),
  refillType: z.enum(['slim', 'round']).optional(),
  initialQuantity: z.number().min(0).optional(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const productionSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  remarks: z.string().min(1, 'Remarks are required'),
});

export const adjustmentSchema = z.object({
  quantity: z.number().refine((v) => v !== 0, 'Quantity cannot be zero'),
  reason: z.string().min(1, 'Reason is required'),
});

const productFieldsSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  price: z.number().min(0, 'Retail price must be zero or greater'),
  purchasePrice: z.number().min(0).optional(),
  tierBPrice: z.number().min(0).optional(),
  tierCPrice: z.number().min(0).optional(),
  gallonType: z.enum(['slim', 'round']).optional(),
  linkedInventoryId: objectIdSchema.optional(),
  category: z.enum(['refill', 'container', 'rental', 'other']).optional(),
  decrementsStock: z.boolean().optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

const productStockLink = (data: { decrementsStock?: boolean; linkedInventoryId?: string }) =>
  !data.decrementsStock || !!data.linkedInventoryId;

export const createProductSchema = productFieldsSchema.refine(productStockLink, {
  message: 'Products that decrement stock must be linked to an inventory item',
  path: ['linkedInventoryId'],
});

export const updateProductSchema = productFieldsSchema.partial().refine(productStockLink, {
  message: 'Products that decrement stock must be linked to an inventory item',
  path: ['linkedInventoryId'],
});

export const updateSettingsSchema = z.object({
  companyName: z.string().min(2).optional(),
  logo: z.string().optional(),
  pricing: z
    .object({
      defaultSlimPrice: z.number().min(0),
      defaultRoundPrice: z.number().min(0),
    })
    .optional(),
  deliveryRules: z
    .object({
      overdueDaysOrange: z.number().min(1),
      overdueDaysRed: z.number().min(1),
    })
    .optional(),
  notificationSettings: z
    .object({
      overdueDelivery: z.boolean(),
      lowInventory: z.boolean(),
      backupReminder: z.boolean(),
      paymentReminder: z.boolean(),
    })
    .optional(),
  theme: z.string().optional(),
});

const invoiceItemSchema = z.object({
  productId: objectIdSchema.optional(),
  name: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one product is required'),
  paymentMethod: z.enum(['cash', 'gcash', 'bank']),
  tax: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

/** @deprecated use createInvoiceSchema */
export const createWaterOrderSchema = createInvoiceSchema;
/** @deprecated use updateInvoiceSchema */
export const updateWaterOrderSchema = updateInvoiceSchema;

export const updatePricingTierSchema = z.object({
  label: z.string().min(1).optional(),
  slimPrice: z.number().min(0).optional(),
  roundPrice: z.number().min(0).optional(),
});

export const deliveryDecisionSchema = z.object({
  action: z.enum(['continue', 'stop']),
  rescheduleDate: z.string().optional(),
});

export const updatePermissionsSchema = z.object({
  customPermissions: z
    .array(z.string())
    .min(1, 'At least one permission is required')
    .refine(
      (perms) => !perms.some((p) => ADMIN_ONLY_PERMISSIONS.includes(p)),
      'Admin-only permissions cannot be assigned to custom roles',
    )
    .refine(
      (perms) => perms.every((p) => ALL_ASSIGNABLE_PERMISSIONS.includes(p)),
      'One or more permissions are invalid',
    ),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
