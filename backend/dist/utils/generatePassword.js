"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTempPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
/** Generates a secure 10-character temporary password */
const generateTempPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;
    const pick = (chars) => chars[crypto_1.default.randomInt(chars.length)];
    const required = [pick(upper), pick(lower), pick(digits), pick(symbols), pick(symbols)];
    const rest = Array.from({ length: 5 }, () => pick(all));
    return [...required, ...rest]
        .sort(() => crypto_1.default.randomInt(3) - 1)
        .join('');
};
exports.generateTempPassword = generateTempPassword;
//# sourceMappingURL=generatePassword.js.map