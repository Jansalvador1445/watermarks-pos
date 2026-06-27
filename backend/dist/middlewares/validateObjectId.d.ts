import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
export declare const validateObjectId: (paramName?: string) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const validateParamObjectId: (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateObjectId.d.ts.map