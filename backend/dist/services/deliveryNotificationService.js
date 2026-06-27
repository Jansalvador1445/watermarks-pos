"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryNotificationService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const Customer_1 = require("../models/Customer");
const Notification_1 = require("../models/Notification");
const Notification_2 = require("../models/Notification");
const userService_1 = require("./userService");
const enums_1 = require("../types/enums");
const deliveryColor_1 = require("../utils/deliveryColor");
const socket_1 = require("../socket");
const logger_1 = require("../config/logger");
class DeliveryNotificationService {
    static async isEnabled() {
        const settings = await Notification_2.Settings.findOne();
        return settings?.notificationSettings?.overdueDelivery !== false;
    }
    static async hasRecentNotification(type, deliveryId, hours = 24) {
        const since = (0, dayjs_1.default)().subtract(hours, 'hour').toDate();
        const existing = await Notification_1.Notification.findOne({
            type,
            'metadata.deliveryId': deliveryId,
            createdAt: { $gte: since },
        });
        return !!existing;
    }
    static async hasUnreadNotification(type, deliveryId) {
        const existing = await Notification_1.Notification.findOne({
            type,
            'metadata.deliveryId': deliveryId,
            isRead: false,
        });
        return !!existing;
    }
    static async publish(notification) {
        (0, socket_1.emitNotification)('all', notification);
        return notification;
    }
    static async checkAndNotifyDeliveries() {
        if (!(await this.isEnabled()))
            return { late3Day: 0, decisions: 0 };
        const deliveries = await Customer_1.Delivery.find({
            isDeleted: false,
            status: { $in: ['pending', 'overdue'] },
            continuationDecision: { $ne: 'stopped' },
        }).populate('customerId', 'fullName');
        let late3DayCount = 0;
        let decisionCount = 0;
        for (const raw of deliveries) {
            const delivery = raw;
            const resolved = (0, deliveryColor_1.resolveDeliveryState)(delivery.status, delivery.date);
            const daysLate = (0, deliveryColor_1.getDaysPastDue)(delivery.date);
            const customerName = delivery.customerId?.fullName || 'Customer';
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
                if (!(await this.hasRecentNotification(enums_1.NotificationType.DELIVERY_3DAY_LATE, deliveryId))) {
                    await this.publish(await userService_1.NotificationService.create({
                        type: enums_1.NotificationType.DELIVERY_3DAY_LATE,
                        title: 'Delivery 3+ Days Late',
                        message: `${customerName} is ${daysLate} days late. Scheduled: ${(0, dayjs_1.default)(delivery.date).format('MMM D, YYYY')}.`,
                        metadata: {
                            deliveryId,
                            customerName,
                            daysLate,
                            scheduledDate: delivery.date,
                            colorCode: 'red',
                        },
                    }));
                }
                if (raw.continuationDecision === 'pending' &&
                    !(await this.hasUnreadNotification(enums_1.NotificationType.DELIVERY_CONTINUE_DECISION, deliveryId))) {
                    decisionCount += 1;
                    await this.publish(await userService_1.NotificationService.create({
                        type: enums_1.NotificationType.DELIVERY_CONTINUE_DECISION,
                        title: 'Continue Delivery?',
                        message: `${customerName} is ${daysLate} days overdue. Do you want to continue this delivery or stop it?`,
                        metadata: {
                            deliveryId,
                            customerName,
                            daysLate,
                            scheduledDate: delivery.date,
                            actionRequired: 'continue_or_stop',
                        },
                    }));
                }
            }
            else if (daysLate >= 2) {
                if (!(await this.hasRecentNotification(enums_1.NotificationType.OVERDUE_DELIVERY, deliveryId, 12))) {
                    await this.publish(await userService_1.NotificationService.create({
                        type: enums_1.NotificationType.OVERDUE_DELIVERY,
                        title: 'Delivery Overdue',
                        message: `${customerName} is ${daysLate} days overdue. Please follow up soon.`,
                        metadata: {
                            deliveryId,
                            customerName,
                            daysLate,
                            scheduledDate: delivery.date,
                            colorCode: 'orange',
                        },
                    }));
                }
            }
        }
        if (late3DayCount > 1) {
            const summaryKey = `summary-3day-${(0, dayjs_1.default)().format('YYYY-MM-DD')}`;
            const hasSummary = await Notification_1.Notification.findOne({
                type: enums_1.NotificationType.DELIVERY_3DAY_LATE,
                'metadata.summaryKey': summaryKey,
            });
            if (!hasSummary) {
                await this.publish(await userService_1.NotificationService.create({
                    type: enums_1.NotificationType.DELIVERY_3DAY_LATE,
                    title: 'Multiple Late Deliveries',
                    message: `${late3DayCount} deliveries are 3 or more days late and need immediate attention.`,
                    metadata: { summaryKey, count: late3DayCount },
                }));
            }
        }
        logger_1.logger.info('Delivery notifications processed', { late3DayCount, decisionCount });
        return { late3Day: late3DayCount, decisions: decisionCount };
    }
    static async markDeliveryNotificationsRead(deliveryId) {
        await Notification_1.Notification.updateMany({ 'metadata.deliveryId': deliveryId, isRead: false }, { isRead: true });
    }
}
exports.DeliveryNotificationService = DeliveryNotificationService;
//# sourceMappingURL=deliveryNotificationService.js.map