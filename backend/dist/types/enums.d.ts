export declare enum UserRole {
    ADMIN = "admin",
    CASHIER = "cashier",
    DELIVERY_STAFF = "delivery_staff",
    CUSTOM = "custom"
}
export declare enum CustomerStatus {
    ENABLED = "enabled",
    DISABLED = "disabled"
}
export declare enum DeliveryStatus {
    DELIVERED = "delivered",
    PENDING = "pending",
    OVERDUE = "overdue"
}
export declare enum ColorCode {
    WHITE = "white",
    ORANGE = "orange",
    RED = "red"
}
export declare enum TransactionType {
    WALKIN = "walkin",
    DELIVERY = "delivery",
    POS = "pos"
}
export declare enum PaymentMethod {
    CASH = "cash",
    GCASH = "gcash",
    BANK = "bank"
}
export declare enum TransactionStatus {
    PAID = "paid",
    PENDING = "pending",
    CANCELLED = "cancelled"
}
export declare enum GallonType {
    SLIM = "slim",
    ROUND = "round"
}
export declare enum InventoryMovementType {
    PRODUCTION = "production",
    DELIVERY = "delivery",
    POS_SALE = "pos_sale",
    WALKIN_SALE = "walkin_sale",
    INVOICE_SALE = "invoice_sale",
    RETURN = "return",
    ADJUSTMENT = "adjustment"
}
export declare enum ProductCategory {
    REFILL = "refill",
    CONTAINER = "container",
    RENTAL = "rental",
    OTHER = "other"
}
export declare enum ProductStatus {
    ACTIVE = "active",
    DISABLED = "disabled"
}
export declare enum NotificationType {
    OVERDUE_DELIVERY = "overdue_delivery",
    DELIVERY_3DAY_LATE = "delivery_3day_late",
    DELIVERY_CONTINUE_DECISION = "delivery_continue_decision",
    LOW_INVENTORY = "low_inventory",
    BACKUP_REMINDER = "backup_reminder",
    PAYMENT_REMINDER = "payment_reminder"
}
export declare enum ContinuationDecision {
    NONE = "none",
    PENDING = "pending",
    CONTINUED = "continued",
    STOPPED = "stopped"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare const ROLE_PERMISSIONS: Record<UserRole, string[]>;
//# sourceMappingURL=enums.d.ts.map