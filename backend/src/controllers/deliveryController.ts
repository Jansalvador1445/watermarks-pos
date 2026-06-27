import { Request, Response } from 'express';
import { DeliveryService } from '../services/deliveryService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { AuthRequest } from '../types/express.d';

export const getDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const result = await DeliveryService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getDelivery = asyncHandler(async (req: Request, res: Response) => {
  const data = await DeliveryService.getById(getParamId(req));
  return successResponse(res, data);
});

export const createDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await DeliveryService.create(req.body, req.user?.userId);
  return successResponse(res, data, 'Delivery created', 201);
});

export const updateDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await DeliveryService.update(getParamId(req), req.body, req.user?.userId);
  return successResponse(res, data, 'Delivery updated');
});

export const deleteDelivery = asyncHandler(async (req: Request, res: Response) => {
  await DeliveryService.delete(getParamId(req));
  return successResponse(res, null, 'Delivery deleted');
});

export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const data = await DeliveryService.getCalendarEvents(startDate as string, endDate as string);
  return successResponse(res, data);
});

export const getDeliveredHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await DeliveryService.getHistory(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const resolveDeliveryDecision = asyncHandler(async (req: Request, res: Response) => {
  const { action, rescheduleDate } = req.body as { action: 'continue' | 'stop'; rescheduleDate?: string };
  const data = await DeliveryService.resolveDecision(getParamId(req), action, rescheduleDate);
  return successResponse(res, data, action === 'continue' ? 'Delivery will continue' : 'Delivery stopped');
});
