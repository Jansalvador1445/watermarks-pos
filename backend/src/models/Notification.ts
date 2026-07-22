import mongoose, { Document, Schema, Types } from 'mongoose';
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

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export interface ILog extends Document {
  userId?: Types.ObjectId;
  action: string;
  module: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const logSchema = new Schema<ILog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    module: { type: String, required: true },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

logSchema.index({ createdAt: -1 });
logSchema.index({ module: 1 });

export const Log = mongoose.model<ILog>('Log', logSchema);

export interface IBackup extends Document {
  filename: string;
  size: number;
  createdBy: Types.ObjectId;
  restoredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const backupSchema = new Schema<IBackup>(
  {
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restoredAt: { type: Date },
  },
  { timestamps: true },
);

export const Backup = mongoose.model<IBackup>('Backup', backupSchema);

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

const settingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, default: 'WATERMARKS Water Refilling Station' },
    logo: { type: String },
    pricing: {
      defaultSlimPrice: { type: Number, default: 35 },
      defaultRoundPrice: { type: Number, default: 40 },
    },
    deliveryRules: {
      overdueDaysOrange: { type: Number, default: 2 },
      overdueDaysRed: { type: Number, default: 3 },
    },
    notificationSettings: {
      overdueDelivery: { type: Boolean, default: true },
      lowInventory: { type: Boolean, default: true },
      backupReminder: { type: Boolean, default: true },
      paymentReminder: { type: Boolean, default: true },
    },
    theme: { type: String, default: 'light' },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
