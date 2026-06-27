import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { AuthRequest } from '../types/express.d';

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await TransactionService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
  const data = await TransactionService.getById(getParamId(req));
  return successResponse(res, data);
});

export const createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const data = await TransactionService.create(req.body, req.user.userId);
  return successResponse(res, data, 'Transaction created', 201);
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const data = await TransactionService.update(getParamId(req), req.body);
  return successResponse(res, data, 'Transaction updated');
});

export const deleteTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  await TransactionService.delete(getParamId(req), req.user.userId);
  return successResponse(res, null, 'Transaction deleted');
});
