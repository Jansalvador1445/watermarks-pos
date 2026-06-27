export type DeliveryColorCode = 'white' | 'orange' | 'red';
export type DeliveryStatus = 'pending' | 'delivered' | 'overdue';
export declare const getDaysPastDue: (deliveryDate: Date | string) => number;
/** Color dot: white = on schedule, orange = 2 days overdue, red = 3+ days overdue */
export declare const computeDeliveryColorCode: (status: string, deliveryDate: Date | string) => DeliveryColorCode;
export declare const resolveDeliveryState: (status: string, deliveryDate: Date | string) => {
    status: DeliveryStatus;
    colorCode: DeliveryColorCode;
};
export declare const getColorCodeLabel: (colorCode: DeliveryColorCode) => string;
//# sourceMappingURL=deliveryColor.d.ts.map