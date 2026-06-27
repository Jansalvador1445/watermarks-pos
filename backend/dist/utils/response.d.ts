import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const successResponse: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const paginatedResponse: <T>(res: Response, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
}, message?: string) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map