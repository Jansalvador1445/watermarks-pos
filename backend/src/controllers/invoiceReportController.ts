import { Request, Response } from 'express';
import { InvoiceReportService } from '../services/invoiceReportService';
import { InvoiceReportFiltersDTO } from '../dtos/InvoiceReportFiltersDTO';
import { asyncHandler, successResponse } from '../utils/response';

export const getInvoiceSummaryReport = asyncHandler(async (req: Request, res: Response) => {
  const filters = InvoiceReportFiltersDTO.validate(req.query as Record<string, unknown>, 'invoice-summary');
  const data = await InvoiceReportService.getInvoiceSummaryReport(filters);
  return successResponse(res, data);
});

export const getInvoiceOutstandingReport = asyncHandler(async (req: Request, res: Response) => {
  const filters = InvoiceReportFiltersDTO.validate(req.query as Record<string, unknown>, 'outstanding');
  const data = await InvoiceReportService.getOutstandingReport(filters);
  return successResponse(res, data);
});
