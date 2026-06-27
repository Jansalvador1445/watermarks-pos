import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/express.d';
import { AppError } from '../utils/response';
import { getParamId } from '../utils/params';

export const validateObjectId =
  (paramName = 'id') =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    const raw = req.params[paramName];
    const id = Array.isArray(raw) ? raw[0] : raw;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid resource identifier', 400));
    }

    next();
  };

export const validateParamObjectId = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const id = getParamId(req);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid resource identifier', 400));
  }
  next();
};
