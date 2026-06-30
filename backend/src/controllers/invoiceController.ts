import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { AuthRequest } from '../types/express.d';

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const result = await InvoiceService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data = await InvoiceService.getById(getParamId(req));
  return successResponse(res, data);
});

export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await InvoiceService.create(req.body, req.user!.userId);
  return successResponse(res, data, 'Invoice created', 201);
});

export const updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await InvoiceService.update(getParamId(req), req.body, req.user!.userId);
  return successResponse(res, data, 'Invoice updated');
});

export const deleteInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  await InvoiceService.delete(getParamId(req), req.user!.userId);
  return successResponse(res, null, 'Invoice deleted');
});

export const convertInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await InvoiceService.convertToDelivery(getParamId(req), req.user?.userId);
  return successResponse(res, data, 'Invoice converted to delivery');
});

/** @deprecated aliases */
export const getWaterOrders = getInvoices;
export const getWaterOrder = getInvoice;
export const createWaterOrder = createInvoice;
export const updateWaterOrder = updateInvoice;
export const deleteWaterOrder = deleteInvoice;
export const convertWaterOrder = convertInvoice;
