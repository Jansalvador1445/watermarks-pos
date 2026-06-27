import { Request } from 'express';
export declare class TransactionService {
    static getAll(req: Request): Promise<{
        data: (import("../models/Transaction").ITransaction & Required<{
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
    static getById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Transaction").ITransaction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Transaction").ITransaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static create(data: Record<string, unknown>, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Transaction").ITransaction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Transaction").ITransaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(id: string, data: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, import("../models/Transaction").ITransaction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Transaction").ITransaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static delete(id: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Transaction").ITransaction, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Transaction").ITransaction & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=transactionService.d.ts.map