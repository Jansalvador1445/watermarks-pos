import mongoose, { Document, Types } from 'mongoose';
import { NotificationType } from '../types/enums';
export interface INotification extends Document {
    userId?: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, mongoose.DefaultSchemaOptions> & INotification & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INotification>;
export interface ILog extends Document {
    userId?: Types.ObjectId;
    action: string;
    module: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Log: mongoose.Model<ILog, {}, {}, {}, mongoose.Document<unknown, {}, ILog, {}, mongoose.DefaultSchemaOptions> & ILog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ILog>;
export interface IBackup extends Document {
    filename: string;
    size: number;
    createdBy: Types.ObjectId;
    restoredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Backup: mongoose.Model<IBackup, {}, {}, {}, mongoose.Document<unknown, {}, IBackup, {}, mongoose.DefaultSchemaOptions> & IBackup & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBackup>;
export interface ISettings extends Document {
    companyName: string;
    logo?: string;
    pricing: {
        defaultSlimPrice: number;
        defaultRoundPrice: number;
    };
    deliveryRules: {
        overdueDaysOrange: number;
        overdueDaysRed: number;
    };
    notificationSettings: {
        overdueDelivery: boolean;
        lowInventory: boolean;
        backupReminder: boolean;
        paymentReminder: boolean;
    };
    theme: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Settings: mongoose.Model<ISettings, {}, {}, {}, mongoose.Document<unknown, {}, ISettings, {}, mongoose.DefaultSchemaOptions> & ISettings & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISettings>;
//# sourceMappingURL=Notification.d.ts.map