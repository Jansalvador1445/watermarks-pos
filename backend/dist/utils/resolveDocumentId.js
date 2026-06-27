"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDocumentId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const response_1 = require("./response");
/** Resolves a MongoDB id from an ObjectId, string, or populated subdocument. */
const resolveDocumentId = (value, label = 'id') => {
    if (value == null)
        throw new response_1.AppError(`Missing ${label}`, 400);
    if (typeof value === 'string')
        return value;
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value.toString();
    if (typeof value === 'object' && value._id != null) {
        return value._id instanceof mongoose_1.default.Types.ObjectId ? value._id.toString() : String(value._id);
    }
    throw new response_1.AppError(`Invalid ${label}`, 400);
};
exports.resolveDocumentId = resolveDocumentId;
//# sourceMappingURL=resolveDocumentId.js.map