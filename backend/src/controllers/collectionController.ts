import { Request, Response } from 'express';
import { CollectionService } from '../services/collectionService';
import { asyncHandler, successResponse } from '../utils/response';

export const getDailyCollection = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const data = await CollectionService.getDaily(date as string | undefined);
  return successResponse(res, data);
});
