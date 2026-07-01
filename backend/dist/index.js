"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', {
        value: crypto_1.default.webcrypto,
    });
}
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const socket_1 = require("./socket");
const cronJobs_1 = require("./jobs/cronJobs");
const deliveryNotificationService_1 = require("./services/deliveryNotificationService");
const ensureAdminUser_1 = require("./services/ensureAdminUser");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const deliveryRoutes_1 = __importDefault(require("./routes/deliveryRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const inventoryRoutes_1 = require("./routes/inventoryRoutes");
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const pricingTierRoutes_1 = __importDefault(require("./routes/pricingTierRoutes"));
const collectionRoutes_1 = __importDefault(require("./routes/collectionRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const userRoutes_1 = require("./routes/userRoutes");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
['logs', env_1.env.UPLOAD_DIR, env_1.env.BACKUP_DIR].forEach((dir) => {
    const dirPath = path_1.default.join(process.cwd(), dir);
    if (!fs_1.default.existsSync(dirPath))
        fs_1.default.mkdirSync(dirPath, { recursive: true });
});
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, cors_1.default)({
        origin: env_1.env.CLIENT_URL,
        credentials: true,
    }));
}
else {
    app.use((0, cors_1.default)({ origin: false, credentials: true }));
}
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)(env_1.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), env_1.env.UPLOAD_DIR)));
app.use('/api', rateLimiter_1.apiLimiter);
app.get('/api/health', (_req, res) => {
    const dbConnected = mongoose_1.default.connection.readyState === 1;
    res.json({
        success: true,
        message: 'Water Refilling Station POS API is running',
        database: dbConnected ? 'connected' : 'disconnected',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/customers', customerRoutes_1.default);
app.use('/api/deliveries', deliveryRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/water-orders', invoiceRoutes_1.default);
app.use('/api/pricing-tiers', pricingTierRoutes_1.default);
app.use('/api/collection', collectionRoutes_1.default);
app.use('/api/transactions', transactionRoutes_1.default);
app.use('/api/gallons', inventoryRoutes_1.gallonRouter);
app.use('/api/inventory', inventoryRoutes_1.inventoryRouter);
app.use('/api/inventory-movements', inventoryRoutes_1.movementRouter);
app.use('/api/products', productRoutes_1.default);
app.use('/api/reports', inventoryRoutes_1.reportRouter);
app.use('/api/users', userRoutes_1.userRouter);
app.use('/api/notifications', userRoutes_1.notificationRouter);
app.use('/api/logs', userRoutes_1.logRouter);
app.use('/api/backups', userRoutes_1.backupRouter);
app.use('/api/settings', userRoutes_1.settingsRouter);
app.use('/api/search', userRoutes_1.searchRouter);
const staticPath = path_1.default.join(process.cwd(), 'web', 'dist');
if (fs_1.default.existsSync(staticPath)) {
    app.use(express_1.default.static(staticPath));
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path_1.default.join(staticPath, 'index.html'));
    });
}
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
(0, socket_1.initSocket)(server);
const isSeedAdminOnly = process.argv.includes('--seed-admin-only');
const start = async () => {
    await (0, db_1.connectDB)();
    await (0, ensureAdminUser_1.ensureAdminUser)();
    if (isSeedAdminOnly) {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    (0, cronJobs_1.initCronJobs)();
    deliveryNotificationService_1.DeliveryNotificationService.checkAndNotifyDeliveries().catch((err) => logger_1.logger.warn('Initial delivery notification check skipped', { err }));
    server.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Water Refilling Station POS server running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
    });
};
start();
exports.default = app;
//# sourceMappingURL=index.js.map