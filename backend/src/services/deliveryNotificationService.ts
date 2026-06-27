import dayjs from 'dayjs';
import { Delivery } from '../models/Customer';
import { Notification } from '../models/Notification';
import { Settings } from '../models/Notification';
import { NotificationService } from './userService';
import { NotificationType } from '../types/enums';
import { getDaysPastDue, resolveDeliveryState } from '../utils/deliveryColor';
import { emitNotification } from '../socket';
import { logger } from '../config/logger';

type PopulatedDelivery = {
  _id: unknown;
  date: Date;
  status: string;
  colorCode: string;
  continuationDecision?: string;
  customerId?: { fullName?: string } | null;
  save: () => Promise<unknown>;
};

export class DeliveryNotificationService {
  private static async isEnabled(): Promise<boolean> {
    const settings = await Settings.findOne();
    return settings?.notificationSettings?.overdueDelivery !== false;
  }

  private static async hasRecentNotification(
    type: NotificationType,
    deliveryId: string,
    hours = 24,
  ): Promise<boolean> {
    const since = dayjs().subtract(hours, 'hour').toDate();
    const existing = await Notification.findOne({
      type,
      'metadata.deliveryId': deliveryId,
      createdAt: { $gte: since },
    });
    return !!existing;
  }

  private static async hasUnreadNotification(type: NotificationType, deliveryId: string): Promise<boolean> {
    const existing = await Notification.findOne({
      type,
      'metadata.deliveryId': deliveryId,
      isRead: false,
    });
    return !!existing;
  }

  private static async publish(notification: Awaited<ReturnType<typeof NotificationService.create>>) {
    emitNotification('all', notification);
    return notification;
  }

  static async checkAndNotifyDeliveries() {
    if (!(await this.isEnabled())) return { late3Day: 0, decisions: 0 };

    const deliveries = await Delivery.find({
      isDeleted: false,
      status: { $in: ['pending', 'overdue'] },
      continuationDecision: { $ne: 'stopped' },
    }).populate('customerId', 'fullName');

    let late3DayCount = 0;
    let decisionCount = 0;

    for (const raw of deliveries) {
      const delivery = raw as unknown as PopulatedDelivery;
      const resolved = resolveDeliveryState(delivery.status, delivery.date);
      const daysLate = getDaysPastDue(delivery.date);
      const customerName =
        (delivery.customerId as { fullName?: string } | null)?.fullName || 'Customer';
      const deliveryId = String(delivery._id);

      if (delivery.status !== resolved.status || delivery.colorCode !== resolved.colorCode) {
        raw.status = resolved.status;
        raw.colorCode = resolved.colorCode;
        await raw.save();
      }

      if (daysLate >= 3) {
        late3DayCount += 1;

        if (!raw.continuationDecision || raw.continuationDecision === 'none') {
          raw.continuationDecision = 'pending';
          await raw.save();
        }

        if (!(await this.hasRecentNotification(NotificationType.DELIVERY_3DAY_LATE, deliveryId))) {
          await this.publish(
            await NotificationService.create({
              type: NotificationType.DELIVERY_3DAY_LATE,
              title: 'Delivery 3+ Days Late',
              message: `${customerName} is ${daysLate} days late. Scheduled: ${dayjs(delivery.date).format('MMM D, YYYY')}.`,
              metadata: {
                deliveryId,
                customerName,
                daysLate,
                scheduledDate: delivery.date,
                colorCode: 'red',
              },
            }),
          );
        }

        if (
          raw.continuationDecision === 'pending' &&
          !(await this.hasUnreadNotification(NotificationType.DELIVERY_CONTINUE_DECISION, deliveryId))
        ) {
          decisionCount += 1;
          await this.publish(
            await NotificationService.create({
              type: NotificationType.DELIVERY_CONTINUE_DECISION,
              title: 'Continue Delivery?',
              message: `${customerName} is ${daysLate} days overdue. Do you want to continue this delivery or stop it?`,
              metadata: {
                deliveryId,
                customerName,
                daysLate,
                scheduledDate: delivery.date,
                actionRequired: 'continue_or_stop',
              },
            }),
          );
        }
      } else if (daysLate >= 2) {
        if (!(await this.hasRecentNotification(NotificationType.OVERDUE_DELIVERY, deliveryId, 12))) {
          await this.publish(
            await NotificationService.create({
              type: NotificationType.OVERDUE_DELIVERY,
              title: 'Delivery Overdue',
              message: `${customerName} is ${daysLate} days overdue. Please follow up soon.`,
              metadata: {
                deliveryId,
                customerName,
                daysLate,
                scheduledDate: delivery.date,
                colorCode: 'orange',
              },
            }),
          );
        }
      }
    }

    if (late3DayCount > 1) {
      const summaryKey = `summary-3day-${dayjs().format('YYYY-MM-DD')}`;
      const hasSummary = await Notification.findOne({
        type: NotificationType.DELIVERY_3DAY_LATE,
        'metadata.summaryKey': summaryKey,
      });
      if (!hasSummary) {
        await this.publish(
          await NotificationService.create({
            type: NotificationType.DELIVERY_3DAY_LATE,
            title: 'Multiple Late Deliveries',
            message: `${late3DayCount} deliveries are 3 or more days late and need immediate attention.`,
            metadata: { summaryKey, count: late3DayCount },
          }),
        );
      }
    }

    logger.info('Delivery notifications processed', { late3DayCount, decisionCount });
    return { late3Day: late3DayCount, decisions: decisionCount };
  }

  static async markDeliveryNotificationsRead(deliveryId: string) {
    await Notification.updateMany(
      { 'metadata.deliveryId': deliveryId, isRead: false },
      { isRead: true },
    );
  }
}
