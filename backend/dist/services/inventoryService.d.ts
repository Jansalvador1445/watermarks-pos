import { Request } from 'express';
import mongoose from 'mongoose';
import { GallonType } from '../types/enums';
interface GallonRecordInput {
    itemKey?: string;
    label?: string;
    type?: GallonType;
    quantity: number;
    remarks?: string;
}
export declare class GallonService {
    private static resolveItemKey;
    private static resolveLabel;
    private static findOrCreateGallon;
    static getOverview(): Promise<{
        items: {
            itemKey: string;
            label: string;
            type: GallonType | undefined;
            currentIn: number;
            currentOut: number;
            returned: number;
        }[];
        slim: {
            itemKey: string;
            label: string;
            type: GallonType | undefined;
            currentIn: number;
            currentOut: number;
            returned: number;
        };
        round: {
            itemKey: string;
            label: string;
            type: GallonType | undefined;
            currentIn: number;
            currentOut: number;
            returned: number;
        };
    }>;
    static recordOut(data: GallonRecordInput, userId?: string): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IGallon, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IGallon & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static recordReturn(data: GallonRecordInput, userId?: string): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IGallon, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IGallon & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private static recordDirection;
    /** @deprecated use recordOut / recordReturn */
    static recordTransaction(data: {
        type: GallonType;
        action: string;
        quantity: number;
        remarks?: string;
    }, userId?: string): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IGallon, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IGallon & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static getHistory(itemKey?: string): Promise<{
        _id: string;
        itemKey: string;
        label: string;
        type: GallonType | undefined;
        direction: "out" | "return";
        quantity: number;
        date: Date;
        remarks: string | undefined;
        userId: mongoose.Types.ObjectId | undefined;
        currentOut: number;
        returned: number;
    }[]>;
}
export declare class InventoryService {
    static getAll(req: Request): Promise<{
        data: (import("../models/Gallon").IInventory & Required<{
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
    static getById(id: string): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static create(data: Record<string, unknown>, userId?: string): Promise<(mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static update(id: string, data: Record<string, unknown>, _userId?: string): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static delete(id: string): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
export declare class ReportService {
    static getSalesReport(startDate: string, endDate: string): Promise<any[]>;
    static getDeliveryReport(startDate: string, endDate: string): Promise<any[]>;
    static getCustomerReport(): Promise<{
        statusCounts: any[];
        outstanding: any;
    }>;
    static getInventoryReport(startDate?: string, endDate?: string): Promise<{
        items: (import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        movementSummary: any[];
        recentMovements: (import("../models/InventoryMovement").IInventoryMovement & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        period: {
            startDate: Date;
            endDate: Date;
        };
    }>;
}
export {};
//# sourceMappingURL=inventoryService.d.ts.map