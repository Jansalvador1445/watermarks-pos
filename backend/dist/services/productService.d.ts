import { Request } from 'express';
import mongoose, { ClientSession } from 'mongoose';
export interface ResolvedTransactionItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    gallonType?: string;
    linkedInventoryId?: string;
    decrementsStock: boolean;
}
export declare class ProductService {
    private static formatProduct;
    /** Refill products always decrement filled water stock when sold. */
    private static normalizeProductPayload;
    private static applyInventoryLink;
    private static validateProductData;
    static getAll(req: Request): Promise<{
        data: Record<string, unknown>[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    static getActiveProducts(): Promise<Record<string, unknown>[]>;
    static getById(id: string): Promise<mongoose.Document<unknown, {}, import("../models/Product").IProduct, {}, mongoose.DefaultSchemaOptions> & import("../models/Product").IProduct & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static create(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    static update(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
    static delete(id: string): Promise<mongoose.Document<unknown, {}, import("../models/Product").IProduct, {}, mongoose.DefaultSchemaOptions> & import("../models/Product").IProduct & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Resolves POS/walk-in line items from the product catalog — never trusts client price or stock flags.
     */
    static resolveCatalogItems(items: Array<{
        productId: string;
        quantity: number;
    }>, session?: ClientSession, customerId?: string): Promise<ResolvedTransactionItem[]>;
}
//# sourceMappingURL=productService.d.ts.map