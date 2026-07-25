import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { customerApi, reportApi } from '@/services/api';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { PAYMENT_METHODS } from '@/utils/constants';
import {
  ALLOWED_STATUSES_BY_REPORT,
  INVOICE_SUMMARY_COLUMNS,
  OUTSTANDING_COLUMNS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  REPORT_TITLE_MAP,
  buildFilterPayload,
  groupByCustomer,
  type InvoicePaymentStatus,
  type InvoiceReportFilters,
  type InvoiceReportType,
} from './reporting';
import { buildCsvBlob, buildPdf, downloadBlob, toDisplayValue } from './reportExport';

const { Text } = Typography;

type SummaryRow = {
  invoice: { invoiceNo?: string; total?: number; createdAt?: string };
  customer?: { _id?: string; fullName?: string } | null;
  paymentStatus: InvoicePaymentStatus;
  totalPaid: number;
  outstandingBalance: number;
  paymentCount: number;
};

type OutstandingRow = SummaryRow & {
  totalAmount?: number;
  paidAmount?: number;
  outstandingAmount?: number;
  daysPastDue?: number;
  agingBucket?: string;
};

interface InvoiceReportsPanelProps {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
}

export const InvoiceReportsPanel = ({ dateRange }: InvoiceReportsPanelProps) => {
  const [reportType, setReportType] = useState<InvoiceReportType>('invoice-summary');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<InvoicePaymentStatus[]>(
    ALLOWED_STATUSES_BY_REPORT['invoice-summary'],
  );
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const allowedStatuses = ALLOWED_STATUSES_BY_REPORT[reportType];

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'report-filter', customerSearch],
    queryFn: () => customerApi.list({ page: 1, limit: 100, search: customerSearch || undefined }).then((r) => r.data),
  });

  const customerOptions =
    customersData?.data?.map((c) => ({ label: c.fullName, value: c._id })) ?? [];

  const handleReportTypeChange = (value: InvoiceReportType) => {
    setReportType(value);
    setStatusFilter(ALLOWED_STATUSES_BY_REPORT[value]);
    setReportData(null);
  };

  const buildFilters = (): InvoiceReportFilters => ({
    startDate: dateRange[0].toISOString(),
    endDate: dateRange[1].toISOString(),
    customerId,
    paymentMethod,
    status: statusFilter,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = buildFilterPayload(buildFilters());
      const response =
        reportType === 'invoice-summary'
          ? await reportApi.invoiceSummary(payload)
          : await reportApi.invoiceOutstanding(payload);
      setReportData(response.data.data);
    } catch {
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const summaryRows: SummaryRow[] = useMemo(() => {
    if (!reportData) return [];
    if (reportType === 'invoice-summary') {
      return (reportData.summary as SummaryRow[]) ?? [];
    }
    return ((reportData.outstanding as OutstandingRow[]) ?? []).map((row) => ({
      invoice: row.invoice,
      customer: row.customer,
      paymentStatus: row.paymentStatus,
      totalPaid: row.paidAmount ?? 0,
      outstandingBalance: row.outstandingAmount ?? 0,
      paymentCount: 0,
      daysPastDue: row.daysPastDue,
      agingBucket: row.agingBucket,
    }));
  }, [reportData, reportType]);

  const grouped = useMemo(() => groupByCustomer(summaryRows), [summaryRows]);

  const exportRows = () => {
    const columns = reportType === 'invoice-summary' ? INVOICE_SUMMARY_COLUMNS : OUTSTANDING_COLUMNS;
    const headers = columns.map((c) => c.label);
    const rows = summaryRows.map((row) => {
      if (reportType === 'invoice-summary') {
        return [
          row.invoice.invoiceNo,
          row.invoice.createdAt ? formatDateTime(row.invoice.createdAt) : '—',
          row.customer?.fullName ?? 'Unknown',
          row.invoice.total,
          row.totalPaid,
          row.outstandingBalance,
          PAYMENT_STATUS_LABELS[row.paymentStatus],
          row.paymentCount,
        ];
      }
      const ext = row as SummaryRow & { daysPastDue?: number; agingBucket?: string };
      return [
        row.invoice.invoiceNo,
        row.invoice.createdAt ? formatDateTime(row.invoice.createdAt) : '—',
        row.customer?.fullName ?? 'Unknown',
        row.invoice.total,
        row.totalPaid,
        row.outstandingBalance,
        PAYMENT_STATUS_LABELS[row.paymentStatus],
        ext.daysPastDue ?? '—',
        ext.agingBucket ?? '—',
      ];
    });
    return { headers, rows, columns };
  };

  const handleExportCsv = async () => {
    let data = reportData;
    if (!data) {
      await handleGenerate();
      data = reportData;
    }
    if (!summaryRows.length) {
      message.warning('No data to export');
      return;
    }
    const { headers, rows } = exportRows();
    downloadBlob(buildCsvBlob(headers, rows.map((r) => r.map(toDisplayValue))), `${reportType}-report.csv`);
  };

  const handleExportPdf = async () => {
    if (!summaryRows.length) {
      message.warning('Generate the report first');
      return;
    }
    const { headers, rows } = exportRows();
    buildPdf(
      REPORT_TITLE_MAP[reportType],
      'Invoice financial report',
      [
        `Date range: ${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
        `Customer: ${customerId ? customerOptions.find((c) => c.value === customerId)?.label ?? customerId : 'All'}`,
        `Payment method: ${paymentMethod ?? 'All'}`,
        `Status: ${statusFilter.map((s) => PAYMENT_STATUS_LABELS[s]).join(', ')}`,
      ],
      [{ title: REPORT_TITLE_MAP[reportType], headers, rows: rows.map((r) => r.map(toDisplayValue)) }],
      `${reportType}-report.pdf`,
    );
  };

  return (
    <div>
      <Space className="mb-16" wrap align="start">
        <Select
          value={reportType}
          onChange={handleReportTypeChange}
          style={{ width: 220 }}
          options={[
            { label: 'Invoice Summary', value: 'invoice-summary' },
            { label: 'Outstanding Balances', value: 'outstanding' },
          ]}
        />
        <Select
          allowClear
          showSearch
          placeholder="Customer"
          style={{ width: 220 }}
          value={customerId}
          onChange={setCustomerId}
          onSearch={setCustomerSearch}
          filterOption={false}
          options={customerOptions}
        />
        <Select
          allowClear
          placeholder="Payment method"
          style={{ width: 150 }}
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAYMENT_METHODS}
        />
        <Space wrap>
          {(['paid', 'unpaid', 'partial', 'credit'] as InvoicePaymentStatus[]).map((status) => (
            <Checkbox
              key={status}
              checked={statusFilter.includes(status)}
              disabled={!allowedStatuses.includes(status)}
              onChange={(e) => {
                setStatusFilter((prev) =>
                  e.target.checked ? [...prev, status] : prev.filter((s) => s !== status),
                );
              }}
            >
              {PAYMENT_STATUS_LABELS[status]}
            </Checkbox>
          ))}
        </Space>
        <Button type="primary" loading={loading} onClick={handleGenerate}>
          Generate Report
        </Button>
        <Button onClick={handleExportCsv}>Export CSV</Button>
        <Button onClick={handleExportPdf}>Export PDF</Button>
      </Space>

      {reportData && reportType === 'invoice-summary' && (
        <Row gutter={16} className="mb-16">
          <Col span={6}>
            <Statistic title="Total Invoices" value={(reportData.totals as { totalInvoices?: number })?.totalInvoices ?? 0} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Invoice Amount"
              value={(reportData.totals as { totalInvoiceAmount?: number })?.totalInvoiceAmount ?? 0}
              prefix="₱"
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Paid"
              value={(reportData.totals as { totalPaid?: number })?.totalPaid ?? 0}
              prefix="₱"
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Outstanding"
              value={(reportData.totals as { totalOutstanding?: number })?.totalOutstanding ?? 0}
              prefix="₱"
              precision={2}
            />
          </Col>
        </Row>
      )}

      {reportData && reportType === 'outstanding' && (
        <Row gutter={16} className="mb-16">
          <Col span={6}>
            <Statistic
              title="Total Outstanding"
              value={(reportData.summary as { totalOutstanding?: number })?.totalOutstanding ?? 0}
              prefix="₱"
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic title="Open Invoices" value={(reportData.summary as { count?: number })?.count ?? 0} />
          </Col>
          {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket) => (
            <Col span={3} key={bucket}>
              <Statistic
                title={bucket}
                value={
                  (reportData.summary as { bucketTotals?: Record<string, { total?: number }> })?.bucketTotals?.[bucket]
                    ?.total ?? 0
                }
                prefix="₱"
                precision={2}
              />
            </Col>
          ))}
        </Row>
      )}

      {!reportData && <Empty description="Set filters and click Generate Report" className="my-32" />}

      {grouped.map((group) => (
        <Card key={group.customerId} title={group.customerName} className="mb-16" size="small">
          <Table
            dataSource={group.rows}
            rowKey={(row) => String(row.invoice.invoiceNo)}
            pagination={false}
            size="small"
            columns={
              reportType === 'invoice-summary'
                ? [
                    { title: 'Invoice No', render: (_: unknown, r: SummaryRow) => r.invoice.invoiceNo },
                    {
                      title: 'Date',
                      render: (_: unknown, r: SummaryRow) =>
                        r.invoice.createdAt ? formatDateTime(r.invoice.createdAt) : '—',
                    },
                    { title: 'Total', render: (_: unknown, r: SummaryRow) => formatCurrency(r.invoice.total ?? 0) },
                    { title: 'Paid', render: (_: unknown, r: SummaryRow) => formatCurrency(r.totalPaid) },
                    {
                      title: 'Balance',
                      render: (_: unknown, r: SummaryRow) => formatCurrency(r.outstandingBalance),
                    },
                    {
                      title: 'Status',
                      render: (_: unknown, r: SummaryRow) => (
                        <Tag color={PAYMENT_STATUS_COLORS[r.paymentStatus]}>{PAYMENT_STATUS_LABELS[r.paymentStatus]}</Tag>
                      ),
                    },
                    { title: 'Payments', render: (_: unknown, r: SummaryRow) => r.paymentCount },
                  ]
                : [
                    { title: 'Invoice No', render: (_: unknown, r: SummaryRow) => r.invoice.invoiceNo },
                    {
                      title: 'Date',
                      render: (_: unknown, r: SummaryRow) =>
                        r.invoice.createdAt ? formatDateTime(r.invoice.createdAt) : '—',
                    },
                    { title: 'Total', render: (_: unknown, r: SummaryRow) => formatCurrency(r.invoice.total ?? 0) },
                    { title: 'Paid', render: (_: unknown, r: SummaryRow) => formatCurrency(r.totalPaid) },
                    {
                      title: 'Outstanding',
                      render: (_: unknown, r: SummaryRow) => formatCurrency(r.outstandingBalance),
                    },
                    {
                      title: 'Status',
                      render: (_: unknown, r: SummaryRow) => (
                        <Tag color={PAYMENT_STATUS_COLORS[r.paymentStatus]}>{PAYMENT_STATUS_LABELS[r.paymentStatus]}</Tag>
                      ),
                    },
                    {
                      title: 'Days Past Due',
                      render: (_: unknown, r: SummaryRow & { daysPastDue?: number }) => r.daysPastDue ?? 0,
                    },
                    {
                      title: 'Aging',
                      render: (_: unknown, r: SummaryRow & { agingBucket?: string }) => (
                        <Tag>{r.agingBucket ?? '—'}</Tag>
                      ),
                    },
                  ]
            }
          />
          <Text type="secondary">
            Customer balance:{' '}
            {formatCurrency(group.rows.reduce((sum, row) => sum + row.outstandingBalance, 0))}
          </Text>
        </Card>
      ))}
    </div>
  );
};
