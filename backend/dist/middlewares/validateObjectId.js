"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParamObjectId = exports.validateObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const response_1 = require("../utils/response");
const params_1 = require("../utils/params");
const validateObjectId = (paramName = 'id') => (req, _res, next) => {
    const raw = req.params[paramName];
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return next(new response_1.AppError('Invalid resource identifier', 400));
    }
    next();
};
exports.validateObjectId = validateObjectId;
const validateParamObjectId = (req, _res, next) => {
    const id = (0, params_1.getParamId)(req);
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return next(new response_1.AppError('Invalid resource identifier', 400));
    }
    next();
};
exports.validateParamObjectId = validateParamObjectId;
//# sourceMappingURL=validateObjectId.js.map