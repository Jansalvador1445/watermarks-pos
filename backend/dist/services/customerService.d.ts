import { Request } from 'express';
export declare class CustomerService {
    private static normalizeLocationFields;
    static getAll(req: Request): Promise<{
        data: (import("../models/Customer").ICustomer & Required<{
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
    static getById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static create(data: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(id: string, data: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static delete(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static toggleStatus(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static importCSV(customers: Record<string, unknown>[]): Promise<{
        imported: number;
    }>;
    static uploadPropertyPhoto(id: string, filename: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deletePropertyPhoto(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Customer").ICustomer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Customer").ICustomer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private static validatePricingCategory;
}
//# sourceMappingURL=customerService.d.ts.map