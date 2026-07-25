export type InvoiceReportType = 'invoice-summary' | 'outstanding';

export type InvoicePaymentStatus = 'paid' | 'unpaid' | 'partial' | 'credit';

export const REPORT_TITLE_MAP: Record<InvoiceReportType, string> = {
  'invoice-summary': 'Invoice Summary',
  outstanding: 'Outstanding Balances',
};

export const ALLOWED_STATUSES_BY_REPORT: Record<InvoiceReportType, InvoicePaymentStatus[]> = {
  'invoice-summary': ['paid', 'unpaid', 'partial', 'credit'],
  outstanding: ['unpaid', 'partial'],
};

export const PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  partial: 'Partial',
  credit: 'Credit',
};

export const PAYMENT_STATUS_COLORS: Record<InvoicePaymentStatus, string> = {
  paid: 'green',
  unpaid: 'orange',
  partial: 'blue',
  credit: 'purple',
};

export interface InvoiceReportFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: InvoicePaymentStatus[];
}

export interface InvoiceReportColumn {
  key: string;
  label: string;
}

export const INVOICE_SUMMARY_COLUMNS: InvoiceReportColumn[] = [
  { key: 'invoiceNo', label: 'Invoice No' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total' },
  { key: 'paid', label: 'Paid' },
  { key: 'balance', label: 'Balance' },
  { key: 'status', label: 'Payment Status' },
  { key: 'payments', label: 'Payments' },
];

export const OUTSTANDING_COLUMNS: InvoiceReportColumn[] = [
  { key: 'invoiceNo', label: 'Invoice No' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total' },
  { key: 'paid', label: 'Paid' },
  { key: 'balance', label: 'Outstanding' },
  { key: 'status', label: 'Status' },
  { key: 'daysPastDue', label: 'Days Past Due' },
  { key: 'agingBucket', label: 'Aging Bucket' },
];

export function buildFilterPayload(filters: InvoiceReportFilters): Record<string, unknown> {
  return {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    customerId: filters.customerId || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    status: filters.status?.length ? filters.status.join(',') : undefined,
  };
}

export function groupByCustomer<T extends { customer?: { _id?: string; fullName?: string } | null }>(
  rows: T[],
): Array<{ customerId: string; customerName: string; rows: T[] }> {
  const map = new Map<string, { customerId: string; customerName: string; rows: T[] }>();

  for (const row of rows) {
    const customerId = row.customer?._id ? String(row.customer._id) : 'unknown';
    const customerName = row.customer?.fullName ?? 'Unknown';
    const group = map.get(customerId) ?? { customerId, customerName, rows: [] };
    group.rows.push(row);
    map.set(customerId, group);
  }

  return [...map.values()].sort((a, b) => a.customerName.localeCompare(b.customerName));
}
