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
exports.Transaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const transactionSchema = new mongoose_1.Schema({
    type: { type: String, enum: Object.values(enums_1.TransactionType), required: true },
    invoiceNo: { type: String, required: true, unique: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    items: [
        {
            productId: { type: String },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 },
            gallonType: { type: String },
            decrementsStock: { type: Boolean },
        },
    ],
    paymentMethod: { type: String, enum: Object.values(enums_1.PaymentMethod), required: true },
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(enums_1.TransactionStatus), default: enums_1.TransactionStatus.PAID },
    receiptUrl: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ isDeleted: 1 });
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
//# sourceMappingURL=Transaction.js.map