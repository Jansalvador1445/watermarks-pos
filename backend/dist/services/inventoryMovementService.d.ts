import { Request } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { GallonType, InventoryMovementType, TransactionType } from '../types/enums';
export interface StockEventPayload {
    inventoryId: string;
    movementType: InventoryMovementType;
    quantity: number;
    referenceNo: string;
    userId: string;
    remarks?: string;
}
export interface ReturnEventPayload {
    inventoryId: string;
    quantity: number;
    referenceNo: string;
    userId: string;
    remarks?: string;
}
export declare class InventoryMovementService {
    static withTransaction<T>(fn: (session?: ClientSession) => Promise<T>): Promise<T>;
    static findInventoryByType(type: GallonType, session?: ClientSession | null): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static findInventoryByProductLink(productId: string, session?: ClientSession | null): Promise<mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private static movementExists;
    static applyStockEvent(session: ClientSession | undefined, payload: StockEventPayload): Promise<{
        item: (mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        beforeStock: number;
        afterStock: number;
        skipped: boolean;
    } | {
        item: mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        beforeStock: number;
        afterStock: number;
        skipped?: undefined;
    }>;
    static recordReturnEvent(session: ClientSession | undefined, payload: ReturnEventPayload): Promise<void>;
    static updateCustomerOutstanding(session: ClientSession | undefined, customerId: string, slimDelta: number, roundDelta: number, userId: string, referenceNo?: string): Promise<(mongoose.Document<unknown, {}, import("../models/Customer").ICustomer, {}, mongoose.DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static processDeliveryCompleted(session: ClientSession | undefined, delivery: {
        referenceNo: string;
        customerId: mongoose.Types.ObjectId | string;
        slimOut: number;
        roundOut: number;
        slimReturn: number;
        roundReturn: number;
        sourceInvoiceId?: mongoose.Types.ObjectId | string;
    }, userId: string): Promise<void>;
    static processTransactionStock(session: ClientSession | undefined, transaction: {
        type: TransactionType;
        invoiceNo: string;
        items: Array<{
            name: string;
            quantity: number;
            gallonType?: string;
            decrementsStock?: boolean;
            productId?: string;
        }>;
    }, userId: string): Promise<void>;
    static reverseTransactionStock(session: ClientSession | undefined, transaction: {
        invoiceNo: string;
        items: Array<{
            name: string;
            quantity: number;
            gallonType?: string;
            decrementsStock?: boolean;
            productId?: string;
        }>;
    }, userId: string): Promise<void>;
    static processInvoiceStock(session: ClientSession | undefined, invoice: {
        invoiceNo: string;
        items: Array<{
            name: string;
            quantity: number;
            gallonType?: string;
            decrementsStock?: boolean;
            productId?: string;
        }>;
    }, userId: string): Promise<void>;
    static reverseInvoiceStock(session: ClientSession | undefined, invoice: {
        invoiceNo: string;
        items: Array<{
            name: string;
            quantity: number;
            gallonType?: string;
            decrementsStock?: boolean;
            productId?: string;
        }>;
    }, userId: string): Promise<void>;
    static addProduction(inventoryId: string, quantity: number, remarks: string, userId: string): Promise<{
        item: (mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        beforeStock: number;
        afterStock: number;
        skipped: boolean;
    } | {
        item: mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        beforeStock: number;
        afterStock: number;
        skipped?: undefined;
    }>;
    static manualAdjust(inventoryId: string, quantity: number, reason: string, userId: string): Promise<{
        item: (mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        beforeStock: number;
        afterStock: number;
        skipped: boolean;
    } | {
        item: mongoose.Document<unknown, {}, import("../models/Gallon").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Gallon").IInventory & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        beforeStock: number;
        afterStock: number;
        skipped?: undefined;
    }>;
    static getMovements(req: Request): Promise<{
        data: (import("../models/InventoryMovement").IInventoryMovement & Required<{
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
    private static sendLowStockNotification;
}
//# sourceMappingURL=inventoryMovementService.d.ts.map