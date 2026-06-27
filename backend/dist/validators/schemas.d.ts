import { z } from 'zod';
import { UserRole } from '../types/enums';
export declare const loginSchema: z.ZodObject<{
    identifier: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const onboardingSchema: z.ZodObject<{
    username: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<{
        admin: UserRole.ADMIN;
        cashier: UserRole.CASHIER;
        delivery_staff: UserRole.DELIVERY_STAFF;
        custom: UserRole.CUSTOM;
    }>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>>;
    customPermissions: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        admin: UserRole.ADMIN;
        cashier: UserRole.CASHIER;
        delivery_staff: UserRole.DELIVERY_STAFF;
        custom: UserRole.CUSTOM;
    }>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>>>;
    customPermissions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const createCustomerSchema: z.ZodObject<{
    fullName: z.ZodString;
    address: z.ZodString;
    phone: z.ZodString;
    pricingCategory: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    manualLocation: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    locationNotes: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    contacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        position: z.ZodOptional<z.ZodString>;
        mobile: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, z.core.$strip>>>;
    status: z.ZodOptional<z.ZodEnum<{
        enabled: "enabled";
        disabled: "disabled";
    }>>;
}, z.core.$strip>;
export declare const updateCustomerSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    pricingCategory: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    manualLocation: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    locationNotes: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    contacts: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        position: z.ZodOptional<z.ZodString>;
        mobile: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, z.core.$strip>>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        enabled: "enabled";
        disabled: "disabled";
    }>>>;
}, z.core.$strip>;
export declare const createDeliverySchema: z.ZodObject<{
    customerId: z.ZodString;
    date: z.ZodString;
    schedule: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<{
        delivered: "delivered";
        pending: "pending";
        overdue: "overdue";
    }>>;
    colorCode: z.ZodOptional<z.ZodEnum<{
        white: "white";
        orange: "orange";
        red: "red";
    }>>;
    remarks: z.ZodOptional<z.ZodString>;
    discount: z.ZodOptional<z.ZodNumber>;
    paid: z.ZodOptional<z.ZodBoolean>;
    slimOut: z.ZodOptional<z.ZodNumber>;
    roundOut: z.ZodOptional<z.ZodNumber>;
    slimIn: z.ZodOptional<z.ZodNumber>;
    roundIn: z.ZodOptional<z.ZodNumber>;
    slimReturn: z.ZodOptional<z.ZodNumber>;
    roundReturn: z.ZodOptional<z.ZodNumber>;
    rescheduleDate: z.ZodOptional<z.ZodString>;
    assignedStaffId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateDeliverySchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    schedule: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        delivered: "delivered";
        pending: "pending";
        overdue: "overdue";
    }>>>;
    colorCode: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        white: "white";
        orange: "orange";
        red: "red";
    }>>>;
    remarks: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    discount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    paid: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    slimOut: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    roundOut: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    slimIn: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    roundIn: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    slimReturn: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    roundReturn: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    rescheduleDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedStaffId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createTransactionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    customerName: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>;
    discount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"pos">;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    customerName: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>;
    discount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"walkin">;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    customerName: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>;
    discount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"delivery">;
    items: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
        gallonType: z.ZodOptional<z.ZodEnum<{
            slim: "slim";
            round: "round";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>], "type">;
export declare const updateTransactionSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const recordGallonOutSchema: z.ZodObject<{
    itemKey: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>>;
    quantity: z.ZodNumber;
    remarks: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const recordGallonReturnSchema: z.ZodObject<{
    itemKey: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>>;
    quantity: z.ZodNumber;
    remarks: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** @deprecated use recordGallonOutSchema / recordGallonReturnSchema */
export declare const createGallonSchema: z.ZodObject<{
    type: z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>;
    action: z.ZodEnum<{
        out: "out";
        return: "return";
    }>;
    quantity: z.ZodNumber;
    remarks: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createInventorySchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    unit: z.ZodDefault<z.ZodString>;
    category: z.ZodString;
    price: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    lowStockThreshold: z.ZodOptional<z.ZodNumber>;
    refillType: z.ZodOptional<z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>>;
    initialQuantity: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateInventorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lowStockThreshold: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    refillType: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>>>;
    initialQuantity: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const productionSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    remarks: z.ZodString;
}, z.core.$strip>;
export declare const adjustmentSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    reason: z.ZodString;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    purchasePrice: z.ZodOptional<z.ZodNumber>;
    tierBPrice: z.ZodOptional<z.ZodNumber>;
    tierCPrice: z.ZodOptional<z.ZodNumber>;
    gallonType: z.ZodOptional<z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>>;
    linkedInventoryId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        refill: "refill";
        container: "container";
        rental: "rental";
        other: "other";
    }>>;
    decrementsStock: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<{
        disabled: "disabled";
        active: "active";
    }>>;
}, z.core.$strip>;
export declare const updateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    purchasePrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    tierBPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    tierCPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    gallonType: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        slim: "slim";
        round: "round";
    }>>>;
    linkedInventoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        refill: "refill";
        container: "container";
        rental: "rental";
        other: "other";
    }>>>;
    decrementsStock: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        disabled: "disabled";
        active: "active";
    }>>>;
}, z.core.$strip>;
export declare const updateSettingsSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    pricing: z.ZodOptional<z.ZodObject<{
        defaultSlimPrice: z.ZodNumber;
        defaultRoundPrice: z.ZodNumber;
    }, z.core.$strip>>;
    deliveryRules: z.ZodOptional<z.ZodObject<{
        overdueDaysOrange: z.ZodNumber;
        overdueDaysRed: z.ZodNumber;
    }, z.core.$strip>>;
    notificationSettings: z.ZodOptional<z.ZodObject<{
        overdueDelivery: z.ZodBoolean;
        lowInventory: z.ZodBoolean;
        backupReminder: z.ZodBoolean;
        paymentReminder: z.ZodBoolean;
    }, z.core.$strip>>;
    theme: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createInvoiceSchema: z.ZodObject<{
    customerId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>;
    tax: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateInvoiceSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>>;
    tax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>>;
}, z.core.$strip>;
/** @deprecated use createInvoiceSchema */
export declare const createWaterOrderSchema: z.ZodObject<{
    customerId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    paymentMethod: z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>;
    tax: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** @deprecated use updateInvoiceSchema */
export declare const updateWaterOrderSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<{
        cash: "cash";
        gcash: "gcash";
        bank: "bank";
    }>>;
    tax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>>;
}, z.core.$strip>;
export declare const updatePricingTierSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    slimPrice: z.ZodOptional<z.ZodNumber>;
    roundPrice: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const deliveryDecisionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        continue: "continue";
        stop: "stop";
    }>;
    rescheduleDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updatePermissionsSchema: z.ZodObject<{
    customPermissions: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    status: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map