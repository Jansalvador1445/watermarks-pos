import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
import { UserRole } from '../types/enums';
export declare const authorize: (...permissions: string[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (...roles: UserRole[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map