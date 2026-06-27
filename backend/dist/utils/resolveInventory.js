"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInventoryId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Gallon_1 = require("../models/Gallon");
const response_1 = require("../utils/response");
/**
 * Resolves an inventory item by MongoDB ObjectId or opaque publicId token.
 * Prevents relying on predictable/enumerable IDs in URLs.
 */
const resolveInventoryId = async (param) => {
    if (mongoose_1.default.Types.ObjectId.isValid(param) && String(new mongoose_1.default.Types.ObjectId(param)) === param) {
        const byId = await Gallon_1.Inventory.findOne({ _id: param, isDeleted: false }).select('_id');
        if (!byId)
            throw new response_1.AppError('Inventory item not found', 404);
        return byId._id.toString();
    }
    const byPublicId = await Gallon_1.Inventory.findOne({ publicId: param, isDeleted: false }).select('_id');
    if (!byPublicId)
        throw new response_1.AppError('Inventory item not found', 404);
    return byPublicId._id.toString();
};
exports.resolveInventoryId = resolveInventoryId;
//# sourceMappingURL=resolveInventory.js.map