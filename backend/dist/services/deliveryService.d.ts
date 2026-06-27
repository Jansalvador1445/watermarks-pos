import { Request } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express.d';
export declare class DeliveryService {
    private static enrichDelivery;
    private static applyDeliveryRules;
    private static isDeliveredTransition;
    private static assertNoLockedFieldChanges;
    private static deliveryInventoryPayload;
    private static markInventoryProcessed;
    private static deliveryHasGallonActivity;
    /** Recover deliveries where inventory/outstanding processing did not complete. */
    private static needsInventoryRecovery;
    private static handleDeliveryCompleted;
    static getAll(req: Request): Promise<{
        data: (import("../models/Customer").IDelivery & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            status: string;
            colorCode: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    static getById(id: string): Promise<import("../models/Customer").IDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        status: string;
        colorCode: string;
    }>;
    static create(data: Record<string, unknown>, userId?: string): Promise<import("../models/Customer").IDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        status: string;
        colorCode: string;
    }>;
    static update(id: string, data: Record<string, unknown>, userId?: string): Promise<import("../models/Customer").IDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        status: string;
        colorCode: string;
    }>;
    static delete(id: string): Promise<mongoose.Document<unknown, {}, import("../models/Customer").IDelivery, {}, mongoose.DefaultSchemaOptions> & import("../models/Customer").IDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static getCalendarEvents(startDate: string, endDate: string): Promise<(import("../models/Customer").IDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        status: string;
        colorCode: string;
    })[]>;
    static getHistory(req: AuthRequest): Promise<{
        data: (import("../models/Customer").IDelivery & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            status: string;
            colorCode: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    static resolveDecision(id: string, action: 'continue' | 'stop', rescheduleDate?: string): Promise<import("../models/Customer").IDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        status: string;
        colorCode: string;
    }>;
}
//# sourceMappingURL=deliveryService.d.ts.map