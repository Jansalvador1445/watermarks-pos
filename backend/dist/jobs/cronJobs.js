"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const dayjs_1 = __importDefault(require("dayjs"));
const Gallon_1 = require("../models/Gallon");
const Notification_1 = require("../models/Notification");
const userService_1 = require("../services/userService");
const deliveryNotificationService_1 = require("../services/deliveryNotificationService");
const enums_1 = require("../types/enums");
const socket_1 = require("../socket");
const dashboardService_1 = require("../services/dashboardService");
const logger_1 = require("../config/logger");
const initCronJobs = () => {
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        try {
            await deliveryNotificationService_1.DeliveryNotificationService.checkAndNotifyDeliveries();
            logger_1.logger.info('Overdue delivery check completed');
        }
        catch (error) {
            logger_1.logger.error('Overdue delivery cron failed', { error });
        }
    });
    node_cron_1.default.schedule('0 8 * * *', async () => {
        try {
            await deliveryNotificationService_1.DeliveryNotificationService.checkAndNotifyDeliveries();
            const settings = await Notification_1.Settings.findOne();
            const lowInventoryEnabled = settings?.notificationSettings?.lowInventory !== false;
            if (lowInventoryEnabled) {
                const lowStockItems = await Gallon_1.Inventory.find({
                    isDeleted: false,
                    $expr: { $lte: ['$currentStock', '$lowStockThreshold'] },
                });
                if (lowStockItems.length > 0) {
                    const notification = await userService_1.NotificationService.create({
                        type: enums_1.NotificationType.LOW_INVENTORY,
                        title: 'Low Inventory Alert',
                        message: `${lowStockItems.length} item(s) are at or below their low stock threshold.`,
                        metadata: {
                            count: lowStockItems.length,
                            items: lowStockItems.map((i) => ({ name: i.name, stock: i.currentStock, threshold: i.lowStockThreshold })),
                        },
                    });
                    (0, socket_1.emitNotification)('all', notification);
                }
            }
            logger_1.logger.info('Daily morning checks completed');
        }
        catch (error) {
            logger_1.logger.error('Daily morning cron failed', { error });
        }
    });
    node_cron_1.default.schedule('0 0 * * 0', async () => {
        try {
            const settings = await Notification_1.Settings.findOne();
            if (settings?.notificationSettings?.backupReminder === false)
                return;
            const latestBackup = await userService_1.BackupService.getLatest();
            const weekAgo = (0, dayjs_1.default)().subtract(7, 'day');
            if (latestBackup && (0, dayjs_1.default)(latestBackup.createdAt).isAfter(weekAgo)) {
                logger_1.logger.info('Backup reminder skipped — recent backup exists');
                return;
            }
            const notification = await userService_1.NotificationService.create({
                type: enums_1.NotificationType.BACKUP_REMINDER,
                title: 'Backup Reminder',
                message: latestBackup
                    ? `Last backup was ${(0, dayjs_1.default)(latestBackup.createdAt).format('MMM D, YYYY')}. Consider creating a new one.`
                    : 'No backups found. Create your first backup to protect business data.',
            });
            (0, socket_1.emitNotification)('all', notification);
            logger_1.logger.info('Backup reminder sent');
        }
        catch (error) {
            logger_1.logger.error('Backup reminder cron failed', { error });
        }
    });
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        try {
            const stats = await dashboardService_1.DashboardService.getStats();
            (0, socket_1.emitDashboardUpdate)(stats);
        }
        catch (error) {
            logger_1.logger.error('Dashboard update cron failed', { error });
        }
    });
    logger_1.logger.info('Cron jobs initialized');
};
exports.initCronJobs = initCronJobs;
//# sourceMappingURL=cronJobs.js.map