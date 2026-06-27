import { Request, Response } from 'express';
import { GallonService, InventoryService, ReportService } from '../services/inventoryService';
import { InventoryMovementService } from '../services/inventoryMovementService';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/response';
import { getParamId } from '../utils/params';
import { resolveInventoryId } from '../utils/resolveInventory';
import { AuthRequest } from '../types/express.d';

export const getGallonOverview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await GallonService.getOverview();
  return successResponse(res, data);
});

export const recordGallonOut = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await GallonService.recordOut(req.body, req.user?.userId);
  return successResponse(res, data, 'Item recorded out', 201);
});

export const recordGallonReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await GallonService.recordReturn(req.body, req.user?.userId);
  return successResponse(res, data, 'Item recorded as returned', 201);
});

export const recordGallonTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await GallonService.recordTransaction(req.body, req.user?.userId);
  return successResponse(res, data, 'Item transaction recorded', 201);
});

export const getGallonHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await GallonService.getHistory(req.query.itemKey as string | undefined);
  return successResponse(res, data);
});

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const result = await InventoryService.getAll(req);
  return paginatedResponse(res, result.data, result.pagination);
});

export const getInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const id = await resolveInventoryId(getParamId(req));
  const data = await InventoryService.getById(id);
  return successResponse(res, data);
});

export const createInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await InventoryService.create(req.body, req.user?.userId);
  return successResponse(res, data, 'Inventory item created', 201);
});

export const updateInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = await resolveInventoryId(getParamId(req));
  const data = await InventoryService.update(id, req.body, req.user?.userId);
  return successResponse(res, data, 'Inventory item updated');
});

export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const id = await resolveInventoryId(getParamId(req));
  await InventoryService.delete(id);
  return successResponse(res, null, 'Inventory item deleted');
});

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const data = await ReportService.getSalesReport(startDate as string, endDate as string);
  return successResponse(res, data);
});

export const getDeliveryReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const data = await ReportService.getDeliveryReport(startDate as string, endDate as string);
  return successResponse(res, data);
});

export const getCustomerReport = asyncHandler(async (_req: Request, res: Response) => {
  const data = await ReportService.getCustomerReport();
  return successResponse(res, data);
});

export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const data = await ReportService.getInventoryReport(startDate as string | undefined, endDate as string | undefined);
  return successResponse(res, data);
});

export const addProduction = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const id = await resolveInventoryId(getParamId(req));
  const { quantity, remarks } = req.body as { quantity: number; remarks: string };
  const data = await InventoryMovementService.addProduction(id, quantity, remarks, req.user.userId);
  return successResponse(res, data, 'Production recorded', 201);
});

export const manualAdjust = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const id = await resolveInventoryId(getParamId(req));
  const { quantity, reason } = req.body as { quantity: number; reason: string };
  const data = await InventoryMovementService.manualAdjust(id, quantity, reason, req.user.userId);
  return successResponse(res, data, 'Adjustment recorded', 201);
});

export const getInventoryMovements = asyncHandler(async (req: Request, res: Response) => {
  const result = await InventoryMovementService.getMovements(req);
  return paginatedResponse(res, result.data, result.pagination);
});
