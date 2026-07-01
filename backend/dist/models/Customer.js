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
exports.Delivery = exports.Customer = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const secureReference_1 = require("../utils/secureReference");
const contactSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    position: { type: String, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
}, { _id: true });
const customerSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pricingCategory: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PricingTier', required: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    manualLocation: { type: String, trim: true, maxlength: 500 },
    locationNotes: { type: String, trim: true, maxlength: 500 },
    addressLink: { type: String, trim: true },
    propertyPhoto: { type: String, trim: true },
    contacts: { type: [contactSchema], default: [] },
    outstandingSlim: { type: Number, default: 0, min: 0 },
    outstandingRound: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(enums_1.CustomerStatus), default: enums_1.CustomerStatus.ENABLED },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
customerSchema.index({ fullName: 'text', phone: 'text', address: 'text' });
customerSchema.index({ isDeleted: 1, status: 1 });
customerSchema.index({ pricingCategory: 1 });
exports.Customer = mongoose_1.default.model('Customer', customerSchema);
const deliverySchema = new mongoose_1.Schema({
    referenceNo: {
        type: String,
        unique: true,
        default: () => (0, secureReference_1.generateSecureReference)('DLV'),
    },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    schedule: { type: String, required: true },
    status: { type: String, default: 'pending' },
    colorCode: { type: String, default: 'white' },
    remarks: { type: String },
    discount: { type: Number, default: 0, min: 0 },
    paid: { type: Boolean, default: false },
    slimOut: { type: Number, default: 0, min: 0 },
    roundOut: { type: Number, default: 0, min: 0 },
    slimIn: { type: Number, default: 0, min: 0 },
    roundIn: { type: Number, default: 0, min: 0 },
    slimReturn: { type: Number, default: 0, min: 0 },
    roundReturn: { type: Number, default: 0, min: 0 },
    rescheduleDate: { type: Date },
    assignedStaffId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    continuationDecision: {
        type: String,
        enum: ['none', 'pending', 'continued', 'stopped'],
        default: 'none',
    },
    inventoryProcessedAt: { type: Date },
    sourceInvoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
deliverySchema.index({ date: -1, status: 1 });
deliverySchema.index({ customerId: 1 });
deliverySchema.index({ assignedStaffId: 1, status: 1 });
deliverySchema.index({ isDeleted: 1 });
deliverySchema.index({ referenceNo: 1 });
exports.Delivery = mongoose_1.default.model('Delivery', deliverySchema);
//# sourceMappingURL=Customer.js.map