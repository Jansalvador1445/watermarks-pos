"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.normalizeMongoUri = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("./logger");
/**
 * Standalone MongoDB (local dev) requires retryWrites=false for session/transaction ops.
 * Atlas and replica sets keep the driver default (retryWrites=true).
 */
const normalizeMongoUri = (uri) => {
    if (/retryWrites=/i.test(uri))
        return uri;
    const isLocalStandalone = /mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(uri);
    if (!isLocalStandalone)
        return uri;
    const separator = uri.includes('?') ? '&' : '?';
    return `${uri}${separator}retryWrites=false`;
};
exports.normalizeMongoUri = normalizeMongoUri;
const connectDB = async () => {
    const uri = (0, exports.normalizeMongoUri)(env_1.env.MONGODB_URI);
    try {
        await mongoose_1.default.connect(uri);
        logger_1.logger.info('MongoDB connected successfully');
    }
    catch (error) {
        logger_1.logger.error('MongoDB connection failed', { error });
        if (env_1.env.NODE_ENV === 'production') {
            logger_1.logger.info('Waiting 3 seconds for MongoDB to start...');
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await mongoose_1.default.connect(uri);
            logger_1.logger.info('MongoDB connected successfully');
            return;
        }
        process.exit(1);
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('MongoDB disconnected');
});
//# sourceMappingURL=db.js.map