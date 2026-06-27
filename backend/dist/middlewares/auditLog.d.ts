import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
export declare const auditLog: (module: string, action?: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auditLog.d.ts.map