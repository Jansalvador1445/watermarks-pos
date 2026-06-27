export declare class DeliveryNotificationService {
    private static isEnabled;
    private static hasRecentNotification;
    private static hasUnreadNotification;
    private static publish;
    static checkAndNotifyDeliveries(): Promise<{
        late3Day: number;
        decisions: number;
    }>;
    static markDeliveryNotificationsRead(deliveryId: string): Promise<void>;
}
//# sourceMappingURL=deliveryNotificationService.d.ts.map