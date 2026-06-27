import cron from 'node-cron';
import dayjs from 'dayjs';
import { Inventory } from '../models/Gallon';
import { Settings } from '../models/Notification';
import { NotificationService, BackupService } from '../services/userService';
import { DeliveryNotificationService } from '../services/deliveryNotificationService';
import { NotificationType } from '../types/enums';
import { emitNotification, emitDashboardUpdate } from '../socket';
import { DashboardService } from '../services/dashboardService';
import { logger } from '../config/logger';

export const initCronJobs = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      await DeliveryNotificationService.checkAndNotifyDeliveries();
      logger.info('Overdue delivery check completed');
    } catch (error) {
      logger.error('Overdue delivery cron failed', { error });
    }
  });

  cron.schedule('0 8 * * *', async () => {
    try {
      await DeliveryNotificationService.checkAndNotifyDeliveries();

      const settings = await Settings.findOne();
      const lowInventoryEnabled = settings?.notificationSettings?.lowInventory !== false;

      if (lowInventoryEnabled) {
        const lowStockItems = await Inventory.find({
          isDeleted: false,
          $expr: { $lte: ['$currentStock', '$lowStockThreshold'] },
        });

        if (lowStockItems.length > 0) {
          const notification = await NotificationService.create({
            type: NotificationType.LOW_INVENTORY,
            title: 'Low Inventory Alert',
            message: `${lowStockItems.length} item(s) are at or below their low stock threshold.`,
            metadata: {
              count: lowStockItems.length,
              items: lowStockItems.map((i) => ({ name: i.name, stock: i.currentStock, threshold: i.lowStockThreshold })),
            },
          });
          emitNotification('all', notification);
        }
      }

      logger.info('Daily morning checks completed');
    } catch (error) {
      logger.error('Daily morning cron failed', { error });
    }
  });

  cron.schedule('0 0 * * 0', async () => {
    try {
      const settings = await Settings.findOne();
      if (settings?.notificationSettings?.backupReminder === false) return;

      const latestBackup = await BackupService.getLatest();
      const weekAgo = dayjs().subtract(7, 'day');

      if (latestBackup && dayjs(latestBackup.createdAt).isAfter(weekAgo)) {
        logger.info('Backup reminder skipped — recent backup exists');
        return;
      }

      const notification = await NotificationService.create({
        type: NotificationType.BACKUP_REMINDER,
        title: 'Backup Reminder',
        message: latestBackup
          ? `Last backup was ${dayjs(latestBackup.createdAt).format('MMM D, YYYY')}. Consider creating a new one.`
          : 'No backups found. Create your first backup to protect business data.',
      });
      emitNotification('all', notification);
      logger.info('Backup reminder sent');
    } catch (error) {
      logger.error('Backup reminder cron failed', { error });
    }
  });

  cron.schedule('*/5 * * * *', async () => {
    try {
      const stats = await DashboardService.getStats();
      emitDashboardUpdate(stats);
    } catch (error) {
      logger.error('Dashboard update cron failed', { error });
    }
  });

  logger.info('Cron jobs initialized');
};
