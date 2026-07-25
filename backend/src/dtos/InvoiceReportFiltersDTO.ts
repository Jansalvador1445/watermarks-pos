import { PaymentMethod } from '../types/enums';
import { AppError } from '../utils/response';
import { InvoicePaymentStatus, getAllowedStatusesForReport } from '../utils/invoicePaymentStatus';

export interface InvoiceReportFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  status?: InvoicePaymentStatus[];
}

const VALID_STATUSES: InvoicePaymentStatus[] = ['paid', 'unpaid', 'partial', 'credit'];
const VALID_METHODS = Object.values(PaymentMethod);
const MAX_RANGE_DAYS = 93;

function parseStatusParam(value: unknown): InvoicePaymentStatus[] | undefined {
  if (value == null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const parsed = raw.map((s) => String(s).trim()).filter((s) => VALID_STATUSES.includes(s as InvoicePaymentStatus));
  return parsed.length ? (parsed as InvoicePaymentStatus[]) : undefined;
}

export class InvoiceReportFiltersDTO {
  static validate(query: Record<string, unknown>, reportType: string): InvoiceReportFilters {
    const filters: InvoiceReportFilters = {};

    const { startDate, endDate, customerId, paymentMethod, status } = query;

    if (startDate != null && startDate !== '') {
      const d = new Date(String(startDate));
      if (Number.isNaN(d.getTime())) {
        throw new AppError('Invalid startDate', 400);
      }
      filters.startDate = d.toISOString();
    }

    if (endDate != null && endDate !== '') {
      const d = new Date(String(endDate));
      if (Number.isNaN(d.getTime())) {
        throw new AppError('Invalid endDate', 400);
      }
      filters.endDate = d.toISOString();
    }

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (start > end) {
        throw new AppError('startDate must be before or equal to endDate', 400);
      }
      const diffDays = (end.getTime() - start.getTime()) / 86400000;
      if (diffDays > MAX_RANGE_DAYS) {
        throw new AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, 400);
      }
    }

    if (customerId != null && customerId !== '') {
      filters.customerId = String(customerId);
    }

    if (paymentMethod != null && paymentMethod !== '') {
      const method = String(paymentMethod);
      if (!VALID_METHODS.includes(method as PaymentMethod)) {
        throw new AppError('Invalid paymentMethod', 400);
      }
      filters.paymentMethod = method as PaymentMethod;
    }

    const parsedStatus = parseStatusParam(status);
    const allowed = getAllowedStatusesForReport(reportType);
    if (parsedStatus?.length) {
      filters.status = parsedStatus.filter((s) => allowed.has(s));
      if (!filters.status.length) {
        throw new AppError('No valid status values for this report type', 400);
      }
    } else {
      filters.status = [...allowed];
    }

    return filters;
  }
}
