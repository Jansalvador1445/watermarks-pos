import mongoose from 'mongoose';
import { AppError } from './response';

type IdLike =
  | mongoose.Types.ObjectId
  | string
  | { _id?: mongoose.Types.ObjectId | string }
  | null
  | undefined;

/** Resolves a MongoDB id from an ObjectId, string, or populated subdocument. */
export const resolveDocumentId = (value: IdLike, label = 'id'): string => {
  if (value == null) throw new AppError(`Missing ${label}`, 400);
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value._id != null) {
    return value._id instanceof mongoose.Types.ObjectId ? value._id.toString() : String(value._id);
  }
  throw new AppError(`Invalid ${label}`, 400);
};
