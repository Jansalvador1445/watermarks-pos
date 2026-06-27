"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureReference = void 0;
const crypto_1 = __importDefault(require("crypto"));
/** Cryptographically secure reference token (128-bit entropy). */
const generateSecureReference = (prefix) => {
    const token = crypto_1.default.randomBytes(16).toString('hex');
    return `${prefix}-${token}`;
};
exports.generateSecureReference = generateSecureReference;
//# sourceMappingURL=secureReference.js.map