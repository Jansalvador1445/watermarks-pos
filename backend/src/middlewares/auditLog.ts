import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
import { Log } from '../models/Notification';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const auditLog =
  (module: string, action?: string) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!WRITE_METHODS.includes(req.method)) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode < 400) {
        Log.create({
          userId: req.user?.userId,
          action: action || `${req.method} ${req.originalUrl}`,
          module,
          ipAddress: req.ip || req.socket.remoteAddress,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            body: sanitizeBody(req.body),
          },
        }).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };

const sanitizeBody = (body: Record<string, unknown>) => {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.passwordHash;
  return sanitized;
};
