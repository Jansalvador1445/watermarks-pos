"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof response_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    logger_1.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    return res.status(500).json({
        success: false,
        message: env_1.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (_req, _res, next) => {
    next(new response_1.AppError('Route not found', 404));
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map