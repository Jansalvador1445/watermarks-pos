"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterOrderStatus = exports.WaterOrder = exports.Invoice = exports.InvoiceStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const secureReference_1 = require("../utils/secureReference");
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["APPROVED"] = "approved";
    InvoiceStatus["REJECTED"] = "rejected";
    InvoiceStatus["CONVERTED"] = "converted";
})(InvoiceStatus || (exports.WaterOrderStatus = exports.InvoiceStatus = InvoiceStatus = {}));
const invoiceItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });
const invoiceSchema = new mongoose_1.Schema({
    invoiceNo: {
        type: String,
        unique: true,
        default: () => (0, secureReference_1.generateSecureReference)('INV'),
    },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: Object.values(enums_1.PaymentMethod), required: true },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: Object.values(InvoiceStatus),
        default: InvoiceStatus.PENDING,
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Delivery' },
    legacyWaterOrder: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ isDeleted: 1 });
invoiceSchema.index({ invoiceNo: 1 });
exports.Invoice = mongoose_1.default.model('Invoice', invoiceSchema);
exports.WaterOrder = exports.Invoice;
//# sourceMappingURL=Invoice.js.map