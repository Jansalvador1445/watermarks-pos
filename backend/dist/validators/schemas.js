"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.updatePermissionsSchema = exports.deliveryDecisionSchema = exports.updatePricingTierSchema = exports.updateWaterOrderSchema = exports.createWaterOrderSchema = exports.updateInvoiceSchema = exports.createInvoiceSchema = exports.updateSettingsSchema = exports.updateProductSchema = exports.createProductSchema = exports.adjustmentSchema = exports.productionSchema = exports.updateInventorySchema = exports.createInventorySchema = exports.createGallonSchema = exports.recordGallonReturnSchema = exports.recordGallonOutSchema = exports.updateTransactionSchema = exports.createTransactionSchema = exports.updateDeliverySchema = exports.createDeliverySchema = exports.updateCustomerSchema = exports.createCustomerSchema = exports.updateUserSchema = exports.createUserSchema = exports.onboardingSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
const permissions_1 = require("../utils/permissions");
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z
        .string()
        .min(3, 'Enter your email or username')
        .max(255)
        .transform((value) => value.toLowerCase().trim()),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password is too long'),
});
exports.onboardingSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username is too long')
        .regex(/^[a-z0-9._-]+$/, 'Username can only contain lowercase letters, numbers, dots, dashes, and underscores')
        .transform((value) => value.toLowerCase().trim()),
    email: zod_1.z
        .string()
        .email('Invalid email address')
        .max(255)
        .transform((value) => value.toLowerCase().trim()),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password is too long'),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    role: zod_1.z.enum([enums_1.UserRole.ADMIN, enums_1.UserRole.CASHIER, enums_1.UserRole.DELIVERY_STAFF, enums_1.UserRole.CUSTOM]),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    customPermissions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial();
const contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Contact name is required'),
    position: zod_1.z.string().optional(),
    mobile: zod_1.z.string().min(10, 'Valid mobile number is required'),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
});
const customerFieldsSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name is required'),
    address: zod_1.z.string().min(5, 'Address is required'),
    phone: zod_1.z.string().min(10, 'Valid phone number is required'),
    pricingCategory: zod_1.z.string().min(1, 'Pricing category is required'),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    manualLocation: zod_1.z.string().max(500).optional().or(zod_1.z.literal('')),
    locationNotes: zod_1.z.string().max(500).optional().or(zod_1.z.literal('')),
    contacts: zod_1.z.array(contactSchema).optional(),
    status: zod_1.z.enum(['enabled', 'disabled']).optional(),
});
const customerCoordinatePair = (data) => (data.latitude == null && data.longitude == null) ||
    (data.latitude != null && data.longitude != null);
exports.createCustomerSchema = customerFieldsSchema.refine(customerCoordinatePair, {
    message: 'Both latitude and longitude are required when setting a map pin',
    path: ['longitude'],
});
exports.updateCustomerSchema = customerFieldsSchema.partial().refine(customerCoordinatePair, {
    message: 'Both latitude and longitude are required when setting a map pin',
    path: ['longitude'],
});
exports.createDeliverySchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, 'Customer is required'),
    date: zod_1.z.string().min(1, 'Date is required'),
    schedule: zod_1.z.string().min(1, 'Schedule is required'),
    status: zod_1.z.enum(['delivered', 'pending', 'overdue']).optional(),
    colorCode: zod_1.z.enum(['white', 'orange', 'red']).optional(),
    remarks: zod_1.z.string().optional(),
    discount: zod_1.z.number().min(0).optional(),
    paid: zod_1.z.boolean().optional(),
    slimOut: zod_1.z.number().min(0).optional(),
    roundOut: zod_1.z.number().min(0).optional(),
    slimIn: zod_1.z.number().min(0).optional(),
    roundIn: zod_1.z.number().min(0).optional(),
    slimReturn: zod_1.z.number().min(0).optional(),
    roundReturn: zod_1.z.number().min(0).optional(),
    rescheduleDate: zod_1.z.string().optional(),
    assignedStaffId: zod_1.z.string().optional(),
});
exports.updateDeliverySchema = exports.createDeliverySchema.partial();
const objectIdSchema = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const catalogTransactionItemSchema = zod_1.z.object({
    productId: objectIdSchema,
    quantity: zod_1.z.number().int().min(1).max(1000),
});
const manualTransactionItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    quantity: zod_1.z.number().int().min(1).max(1000),
    price: zod_1.z.number().min(0).max(1_000_000),
    gallonType: zod_1.z.enum(['slim', 'round']).optional(),
});
const transactionBaseSchema = zod_1.z.object({
    customerId: objectIdSchema.optional(),
    customerName: zod_1.z.string().max(200).optional(),
    paymentMethod: zod_1.z.enum(['cash', 'gcash', 'bank']),
    discount: zod_1.z.number().min(0).max(1_000_000).optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.createTransactionSchema = zod_1.z.discriminatedUnion('type', [
    transactionBaseSchema.extend({
        type: zod_1.z.literal('pos'),
        items: zod_1.z.array(catalogTransactionItemSchema).min(1, 'At least one item is required'),
    }),
    transactionBaseSchema.extend({
        type: zod_1.z.literal('walkin'),
        items: zod_1.z.array(catalogTransactionItemSchema).min(1, 'At least one item is required'),
    }),
    transactionBaseSchema.extend({
        type: zod_1.z.literal('delivery'),
        items: zod_1.z.array(manualTransactionItemSchema).min(1, 'At least one item is required'),
    }),
]);
exports.updateTransactionSchema = zod_1.z.object({
    notes: zod_1.z.string().max(500).optional(),
});
const gallonItemRefSchema = zod_1.z
    .object({
    itemKey: zod_1.z.string().min(1).max(80).optional(),
    label: zod_1.z.string().min(1).max(120).optional(),
    type: zod_1.z.enum(['slim', 'round']).optional(),
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
    remarks: zod_1.z.string().optional(),
})
    .refine((data) => !!(data.itemKey || data.label || data.type), {
    message: 'Item is required (select existing or enter a container name)',
});
exports.recordGallonOutSchema = gallonItemRefSchema;
exports.recordGallonReturnSchema = gallonItemRefSchema;
/** @deprecated use recordGallonOutSchema / recordGallonReturnSchema */
exports.createGallonSchema = zod_1.z.object({
    type: zod_1.z.enum(['slim', 'round']),
    action: zod_1.z.enum(['out', 'return']),
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
    remarks: zod_1.z.string().optional(),
});
exports.createInventorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name is required'),
    sku: zod_1.z.string().optional(),
    unit: zod_1.z.string().min(1, 'Unit is required').default('pcs'),
    category: zod_1.z.string().min(1, 'Category is required'),
    price: zod_1.z.number().min(0).optional(),
    description: zod_1.z.string().optional(),
    lowStockThreshold: zod_1.z.number().min(0).optional(),
    refillType: zod_1.z.enum(['slim', 'round']).optional(),
    initialQuantity: zod_1.z.number().min(0).optional(),
});
exports.updateInventorySchema = exports.createInventorySchema.partial();
exports.productionSchema = zod_1.z.object({
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
    remarks: zod_1.z.string().min(1, 'Remarks are required'),
});
exports.adjustmentSchema = zod_1.z.object({
    quantity: zod_1.z.number().refine((v) => v !== 0, 'Quantity cannot be zero'),
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
const productFieldsSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name is required'),
    price: zod_1.z.number().min(0, 'Retail price must be zero or greater'),
    purchasePrice: zod_1.z.number().min(0).optional(),
    tierBPrice: zod_1.z.number().min(0).optional(),
    tierCPrice: zod_1.z.number().min(0).optional(),
    gallonType: zod_1.z.enum(['slim', 'round']).optional(),
    linkedInventoryId: objectIdSchema.optional(),
    category: zod_1.z.enum(['refill', 'container', 'rental', 'other']).optional(),
    decrementsStock: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['active', 'disabled']).optional(),
});
const productStockLink = (data) => !data.decrementsStock || !!data.linkedInventoryId;
exports.createProductSchema = productFieldsSchema.refine(productStockLink, {
    message: 'Products that decrement stock must be linked to an inventory item',
    path: ['linkedInventoryId'],
});
exports.updateProductSchema = productFieldsSchema.partial().refine(productStockLink, {
    message: 'Products that decrement stock must be linked to an inventory item',
    path: ['linkedInventoryId'],
});
exports.updateSettingsSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2).optional(),
    logo: zod_1.z.string().optional(),
    pricing: zod_1.z
        .object({
        defaultSlimPrice: zod_1.z.number().min(0),
        defaultRoundPrice: zod_1.z.number().min(0),
    })
        .optional(),
    deliveryRules: zod_1.z
        .object({
        overdueDaysOrange: zod_1.z.number().min(1),
        overdueDaysRed: zod_1.z.number().min(1),
    })
        .optional(),
    notificationSettings: zod_1.z
        .object({
        overdueDelivery: zod_1.z.boolean(),
        lowInventory: zod_1.z.boolean(),
        backupReminder: zod_1.z.boolean(),
        paymentReminder: zod_1.z.boolean(),
    })
        .optional(),
    theme: zod_1.z.string().optional(),
});
const invoiceItemSchema = zod_1.z.object({
    productId: objectIdSchema.optional(),
    name: zod_1.z.string().min(1),
    quantity: zod_1.z.number().min(1),
    unitPrice: zod_1.z.number().min(0),
    discount: zod_1.z.number().min(0).optional(),
});
exports.createInvoiceSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, 'Customer is required'),
    items: zod_1.z.array(invoiceItemSchema).min(1, 'At least one product is required'),
    paymentMethod: zod_1.z.enum(['cash', 'gcash', 'bank']),
    tax: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateInvoiceSchema = exports.createInvoiceSchema.partial().extend({
    status: zod_1.z.enum(['pending', 'approved', 'rejected']).optional(),
});
/** @deprecated use createInvoiceSchema */
exports.createWaterOrderSchema = exports.createInvoiceSchema;
/** @deprecated use updateInvoiceSchema */
exports.updateWaterOrderSchema = exports.updateInvoiceSchema;
exports.updatePricingTierSchema = zod_1.z.object({
    label: zod_1.z.string().min(1).optional(),
    slimPrice: zod_1.z.number().min(0).optional(),
    roundPrice: zod_1.z.number().min(0).optional(),
});
exports.deliveryDecisionSchema = zod_1.z.object({
    action: zod_1.z.enum(['continue', 'stop']),
    rescheduleDate: zod_1.z.string().optional(),
});
exports.updatePermissionsSchema = zod_1.z.object({
    customPermissions: zod_1.z
        .array(zod_1.z.string())
        .min(1, 'At least one permission is required')
        .refine((perms) => !perms.some((p) => permissions_1.ADMIN_ONLY_PERMISSIONS.includes(p)), 'Admin-only permissions cannot be assigned to custom roles')
        .refine((perms) => perms.every((p) => permissions_1.ALL_ASSIGNABLE_PERMISSIONS.includes(p)), 'One or more permissions are invalid'),
});
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    status: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map