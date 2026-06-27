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
exports.Settings = exports.Backup = exports.Log = exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const notificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: Object.values(enums_1.NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
exports.Notification = mongoose_1.default.model('Notification', notificationSchema);
const logSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    module: { type: String, required: true },
    ipAddress: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
logSchema.index({ createdAt: -1 });
logSchema.index({ module: 1 });
exports.Log = mongoose_1.default.model('Log', logSchema);
const backupSchema = new mongoose_1.Schema({
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    restoredAt: { type: Date },
}, { timestamps: true });
exports.Backup = mongoose_1.default.model('Backup', backupSchema);
const settingsSchema = new mongoose_1.Schema({
    companyName: { type: String, default: 'H2O Water Refilling' },
    logo: { type: String },
    pricing: {
        defaultSlimPrice: { type: Number, default: 35 },
        defaultRoundPrice: { type: Number, default: 40 },
    },
    deliveryRules: {
        overdueDaysOrange: { type: Number, default: 2 },
        overdueDaysRed: { type: Number, default: 3 },
    },
    notificationSettings: {
        overdueDelivery: { type: Boolean, default: true },
        lowInventory: { type: Boolean, default: true },
        backupReminder: { type: Boolean, default: true },
        paymentReminder: { type: Boolean, default: true },
    },
    theme: { type: String, default: 'light' },
}, { timestamps: true });
exports.Settings = mongoose_1.default.model('Settings', settingsSchema);
//# sourceMappingURL=Notification.js.map