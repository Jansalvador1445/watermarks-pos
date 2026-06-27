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
exports.InventoryMovement = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const inventoryMovementSchema = new mongoose_1.Schema({
    date: { type: Date, required: true, default: Date.now },
    itemId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    movementType: { type: String, enum: Object.values(enums_1.InventoryMovementType), required: true },
    quantity: { type: Number, required: true },
    beforeStock: { type: Number, required: true, min: 0 },
    afterStock: { type: Number, required: true, min: 0 },
    referenceNo: { type: String, required: true, trim: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
inventoryMovementSchema.index({ date: -1 });
inventoryMovementSchema.index({ itemId: 1, date: -1 });
inventoryMovementSchema.index({ movementType: 1, date: -1 });
inventoryMovementSchema.index({ referenceNo: 1 });
inventoryMovementSchema.index({ referenceNo: 1, itemId: 1, movementType: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
inventoryMovementSchema.index({ isDeleted: 1 });
exports.InventoryMovement = mongoose_1.default.model('InventoryMovement', inventoryMovementSchema);
//# sourceMappingURL=InventoryMovement.js.map