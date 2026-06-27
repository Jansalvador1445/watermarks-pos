import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';
export declare const errorHandler: (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export declare const notFoundHandler: (_req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map