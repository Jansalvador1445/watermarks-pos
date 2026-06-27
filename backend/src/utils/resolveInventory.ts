import mongoose from 'mongoose';
import { Inventory } from '../models/Gallon';
import { AppError } from '../utils/response';

/**
 * Resolves an inventory item by MongoDB ObjectId or opaque publicId token.
 * Prevents relying on predictable/enumerable IDs in URLs.
 */
export const resolveInventoryId = async (param: string): Promise<string> => {
  if (mongoose.Types.ObjectId.isValid(param) && String(new mongoose.Types.ObjectId(param)) === param) {
    const byId = await Inventory.findOne({ _id: param, isDeleted: false }).select('_id');
    if (!byId) throw new AppError('Inventory item not found', 404);
    return byId._id.toString();
  }

  const byPublicId = await Inventory.findOne({ publicId: param, isDeleted: false }).select('_id');
  if (!byPublicId) throw new AppError('Inventory item not found', 404);
  return byPublicId._id.toString();
};
