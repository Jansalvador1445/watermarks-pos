import { Request } from 'express';
import { NotificationType } from '../types/enums';
import mongoose from 'mongoose';
export declare class UserService {
    static getAll(req: Request): Promise<{
        data: (import("../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    static getById(id: string): Promise<mongoose.Document<unknown, {}, import("../models/User").IUser, {}, mongoose.DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static create(data: Record<string, unknown>): Promise<{
        user: (mongoose.Document<unknown, {}, import("../models/User").IUser, {}, mongoose.DefaultSchemaOptions> & import("../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        tempPassword: string;
    }>;
    static update(id: string, data: Record<string, unknown>): Promise<mongoose.Document<unknown, {}, import("../models/User").IUser, {}, mongoose.DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updatePermissions(id: string, customPermissions: string[]): Promise<mongoose.Document<unknown, {}, import("../models/User").IUser, {}, mongoose.DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static delete(id: string): Promise<mongoose.Document<unknown, {}, import("../models/User").IUser, {}, mongoose.DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
export declare class NotificationService {
    static getAll(req: Request, userId?: string): Promise<{
        data: (import("../models/Notification").INotification & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
        unreadCount: number;
    }>;
    static markAsRead(id: string): Promise<(mongoose.Document<unknown, {}, import("../models/Notification").INotification, {}, mongoose.DefaultSchemaOptions> & import("../models/Notification").INotification & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static markAllAsRead(userId?: string): Promise<{
        message: string;
    }>;
    static create(data: {
        type: NotificationType;
        title: string;
        message: string;
        userId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<mongoose.Document<unknown, {}, import("../models/Notification").INotification, {}, mongoose.DefaultSchemaOptions> & import("../models/Notification").INotification & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
export declare class LogService {
    static getAll(req: Request): Promise<{
        data: (import("../models/Notification").ILog & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
export declare class BackupService {
    static getAll(): Promise<(import("../models/Notification").IBackup & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getLatest(): Promise<(mongoose.Document<unknown, {}, import("../models/Notification").IBackup, {}, mongoose.DefaultSchemaOptions> & import("../models/Notification").IBackup & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static create(userId: string): Promise<mongoose.Document<unknown, {}, import("../models/Notification").IBackup, {}, mongoose.DefaultSchemaOptions> & import("../models/Notification").IBackup & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static download(id: string): Promise<{
        filepath: string;
        filename: string;
    }>;
}
export declare class SettingsService {
    static get(): Promise<mongoose.Document<unknown, {}, import("../models/Notification").ISettings, {}, mongoose.DefaultSchemaOptions> & import("../models/Notification").ISettings & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(data: Record<string, unknown>): Promise<mongoose.Document<unknown, {}, import("../models/Notification").ISettings, {}, mongoose.DefaultSchemaOptions> & import("../models/Notification").ISettings & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=userService.d.ts.map