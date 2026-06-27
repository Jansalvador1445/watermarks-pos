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
exports.WaterOrder = exports.WaterOrderStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
var WaterOrderStatus;
(function (WaterOrderStatus) {
    WaterOrderStatus["PENDING"] = "pending";
    WaterOrderStatus["APPROVED"] = "approved";
    WaterOrderStatus["REJECTED"] = "rejected";
    WaterOrderStatus["CONVERTED"] = "converted";
})(WaterOrderStatus || (exports.WaterOrderStatus = WaterOrderStatus = {}));
const waterOrderSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    gallonType: { type: String, enum: Object.values(enums_1.GallonType), required: true },
    quantity: { type: Number, required: true, min: 1 },
    preferredDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: Object.values(enums_1.PaymentMethod), required: true },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: Object.values(WaterOrderStatus),
        default: WaterOrderStatus.PENDING,
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Delivery' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
waterOrderSchema.index({ status: 1, preferredDate: -1 });
waterOrderSchema.index({ customerId: 1 });
waterOrderSchema.index({ isDeleted: 1 });
exports.WaterOrder = mongoose_1.default.model('WaterOrder', waterOrderSchema);
//# sourceMappingURL=WaterOrder.js.map