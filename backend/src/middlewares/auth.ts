import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/response';
import { AuthRequest } from '../types/express.d';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      throw new AppError('Authentication required', 401);
    }
    const decoded = verifyAccessToken(token);
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;
    if (token) {
      (req as AuthRequest).user = verifyAccessToken(token);
    }
  } catch {
    // ignore
  }
  next();
};
