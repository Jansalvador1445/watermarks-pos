"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.UserStatus = exports.ContinuationDecision = exports.NotificationType = exports.ProductStatus = exports.ProductCategory = exports.InventoryMovementType = exports.GallonType = exports.TransactionStatus = exports.PaymentMethod = exports.TransactionType = exports.ColorCode = exports.DeliveryStatus = exports.CustomerStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["CASHIER"] = "cashier";
    UserRole["DELIVERY_STAFF"] = "delivery_staff";
    UserRole["CUSTOM"] = "custom";
})(UserRole || (exports.UserRole = UserRole = {}));
var CustomerStatus;
(function (CustomerStatus) {
    CustomerStatus["ENABLED"] = "enabled";
    CustomerStatus["DISABLED"] = "disabled";
})(CustomerStatus || (exports.CustomerStatus = CustomerStatus = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["OVERDUE"] = "overdue";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var ColorCode;
(function (ColorCode) {
    ColorCode["WHITE"] = "white";
    ColorCode["ORANGE"] = "orange";
    ColorCode["RED"] = "red";
})(ColorCode || (exports.ColorCode = ColorCode = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["WALKIN"] = "walkin";
    TransactionType["DELIVERY"] = "delivery";
    TransactionType["POS"] = "pos";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["GCASH"] = "gcash";
    PaymentMethod["BANK"] = "bank";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PAID"] = "paid";
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["CANCELLED"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var GallonType;
(function (GallonType) {
    GallonType["SLIM"] = "slim";
    GallonType["ROUND"] = "round";
})(GallonType || (exports.GallonType = GallonType = {}));
var InventoryMovementType;
(function (InventoryMovementType) {
    InventoryMovementType["PRODUCTION"] = "production";
    InventoryMovementType["DELIVERY"] = "delivery";
    InventoryMovementType["POS_SALE"] = "pos_sale";
    InventoryMovementType["WALKIN_SALE"] = "walkin_sale";
    InventoryMovementType["INVOICE_SALE"] = "invoice_sale";
    InventoryMovementType["RETURN"] = "return";
    InventoryMovementType["ADJUSTMENT"] = "adjustment";
})(InventoryMovementType || (exports.InventoryMovementType = InventoryMovementType = {}));
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["REFILL"] = "refill";
    ProductCategory["CONTAINER"] = "container";
    ProductCategory["RENTAL"] = "rental";
    ProductCategory["OTHER"] = "other";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["DISABLED"] = "disabled";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["OVERDUE_DELIVERY"] = "overdue_delivery";
    NotificationType["DELIVERY_3DAY_LATE"] = "delivery_3day_late";
    NotificationType["DELIVERY_CONTINUE_DECISION"] = "delivery_continue_decision";
    NotificationType["LOW_INVENTORY"] = "low_inventory";
    NotificationType["BACKUP_REMINDER"] = "backup_reminder";
    NotificationType["PAYMENT_REMINDER"] = "payment_reminder";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ContinuationDecision;
(function (ContinuationDecision) {
    ContinuationDecision["NONE"] = "none";
    ContinuationDecision["PENDING"] = "pending";
    ContinuationDecision["CONTINUED"] = "continued";
    ContinuationDecision["STOPPED"] = "stopped";
})(ContinuationDecision || (exports.ContinuationDecision = ContinuationDecision = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
exports.ROLE_PERMISSIONS = {
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
//# sourceMappingURL=enums.js.map