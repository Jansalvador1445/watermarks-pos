import { Request } from 'express';
export declare class WaterOrderService {
    static getAll(req: Request): Promise<{
        data: (import("../models/WaterOrder").IWaterOrder & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    static getById(id: string): Promise<import("../models/WaterOrder").IWaterOrder & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static create(data: Record<string, unknown>, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/WaterOrder").IWaterOrder, {}, import("mongoose").DefaultSchemaOptions> & import("../models/WaterOrder").IWaterOrder & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(id: string, data: Record<string, unknown>): Promise<(import("mongoose").Document<unknown, {}, import("../models/WaterOrder").IWaterOrder, {}, import("mongoose").DefaultSchemaOptions> & import("../models/WaterOrder").IWaterOrder & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static delete(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/WaterOrder").IWaterOrder, {}, import("mongoose").DefaultSchemaOptions> & import("../models/WaterOrder").IWaterOrder & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static convertToDelivery(id: string, userId?: string): Promise<{
        order: (import("../models/WaterOrder").IWaterOrder & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
        delivery: import("mongoose").Document<unknown, {}, import("../models/Customer").IDelivery, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").IDelivery & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
}
//# sourceMappingURL=waterOrderService.d.ts.map