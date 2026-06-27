import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { asyncHandler, successResponse } from '../utils/response';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await DashboardService.getStats();
  return successResponse(res, data);
});

export const getSales = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || 'daily';
  const range = (req.query.range as string) || 'this-month';
  const data = await DashboardService.getSales(period, range);
  return successResponse(res, data);
});

export const getDeliveries = asyncHandler(async (_req: Request, res: Response) => {
  const data = await DashboardService.getDeliveriesOverview();
  return successResponse(res, data);
});

export const getInventory = asyncHandler(async (_req: Request, res: Response) => {
  const data = await DashboardService.getInventoryOverview();
  return successResponse(res, data);
});

export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await DashboardService.getActivityLogs(limit);
  return successResponse(res, data);
});

export const getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const data = await DashboardService.getTopCustomers(limit);
  return successResponse(res, data);
});

export const getRecentDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const data = await DashboardService.getRecentDeliveries(limit);
  return successResponse(res, data);
});

export const getRecentTransactions = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const data = await DashboardService.getRecentTransactions(limit);
  return successResponse(res, data);
});

export const getSystemSummary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await DashboardService.getSystemSummary();
  return successResponse(res, data);
});
