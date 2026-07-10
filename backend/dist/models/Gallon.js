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
exports.Inventory = exports.Gallon = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const secureReference_1 = require("../utils/secureReference");
const gallonSchema = new mongoose_1.Schema({
    itemKey: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(enums_1.GallonType) },
    currentIn: { type: Number, default: 0, min: 0 },
    currentOut: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
    history: [
        {
            direction: { type: String, enum: ['out', 'return'], required: true },
            quantity: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            remarks: { type: String },
        },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
gallonSchema.index({ itemKey: 1, date: -1 });
gallonSchema.index({ itemKey: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
exports.Gallon = mongoose_1.default.model('Gallon', gallonSchema);
const inventorySchema = new mongoose_1.Schema({
    publicId: {
        type: String,
        unique: true,
        default: () => (0, secureReference_1.generateSecureReference)('ITM'),
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    unit: { type: String, required: true, trim: true, default: 'pcs' },
    category: { type: String, required: true, trim: true, default: 'general' },
    price: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true },
    refillType: { type: String, enum: Object.values(enums_1.GallonType) },
    currentStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    borrowed: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 },
    history: [
        {
            action: { type: String, required: true },
            quantity: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            remarks: { type: String },
        },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
inventorySchema.index({ name: 'text', sku: 'text', category: 1 });
inventorySchema.index({ isDeleted: 1 });
inventorySchema.index({ refillType: 1 });
exports.Inventory = mongoose_1.default.model('Inventory', inventorySchema);
//# sourceMappingURL=Gallon.js.map