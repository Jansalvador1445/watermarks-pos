import { PricingTier } from '../models/PricingTier';
import { AppError } from '../utils/response';

export class PricingTierService {
  static async list() {
    return PricingTier.find().sort({ code: 1 }).lean();
  }

  static async getById(id: string) {
    const tier = await PricingTier.findById(id);
    if (!tier) throw new AppError('Pricing tier not found', 404);
    return tier;
  }

  static async update(id: string, data: Record<string, unknown>) {
    const tier = await PricingTier.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!tier) throw new AppError('Pricing tier not found', 404);
    return tier;
  }
}
