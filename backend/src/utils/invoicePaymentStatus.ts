export type InvoicePaymentStatus = 'paid' | 'unpaid' | 'partial' | 'credit';

export function computePaymentStatus(
  invoiceTotal: number,
  totalPayments: number,
): InvoicePaymentStatus {
  if (totalPayments === 0) return 'unpaid';
  if (totalPayments > invoiceTotal) return 'credit';
  if (totalPayments >= invoiceTotal) return 'paid';
  return 'partial';
}

export function computeOutstandingBalance(invoiceTotal: number, totalPayments: number): number {
  return Math.max(0, invoiceTotal - totalPayments);
}

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export function computeAgingBucket(invoiceDate: Date, now = new Date()): { daysPastDue: number; bucket: AgingBucket } {
  const daysPastDue = Math.max(0, Math.floor((now.getTime() - invoiceDate.getTime()) / 86400000));
  let bucket: AgingBucket = '0-30';
  if (daysPastDue > 90) bucket = '90+';
  else if (daysPastDue > 60) bucket = '61-90';
  else if (daysPastDue > 30) bucket = '31-60';
  return { daysPastDue, bucket };
}

export const ALLOWED_STATUSES_BY_REPORT: Record<string, InvoicePaymentStatus[]> = {
  'invoice-summary': ['unpaid', 'partial', 'paid', 'credit'],
  outstanding: ['unpaid', 'partial'],
};

export function getAllowedStatusesForReport(reportType: string): Set<InvoicePaymentStatus> {
  return new Set(ALLOWED_STATUSES_BY_REPORT[reportType] ?? []);
}
