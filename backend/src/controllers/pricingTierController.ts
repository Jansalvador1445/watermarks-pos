import { Request, Response } from 'express';
import { PricingTierService } from '../services/pricingTierService';
import { asyncHandler, successResponse } from '../utils/response';
import { getParamId } from '../utils/params';

export const getPricingTiers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await PricingTierService.list();
  return successResponse(res, data);
});

export const updatePricingTier = asyncHandler(async (req: Request, res: Response) => {
  const data = await PricingTierService.update(getParamId(req), req.body);
  return successResponse(res, data, 'Pricing tier updated');
});
