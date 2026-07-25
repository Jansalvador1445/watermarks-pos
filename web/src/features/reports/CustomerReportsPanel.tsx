import { useState } from 'react';
import {
  Button,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { pricingTierApi, reportApi } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { getTierLabel } from '@/utils/pricingTier';
import type { CustomerReportRow } from '@/types';
import { buildCsvBlob, buildPdf, downloadBlob, toDisplayValue } from './reportExport';

interface CustomerReportsPanelProps {
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

export const CustomerReportsPanel = ({ dateRange }: CustomerReportsPanelProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [pricingCategory, setPricingCategory] = useState<string | undefined>();
  const [hasGallonOutstanding, setHasGallonOutstanding] = useState<string | undefined>();
  const [hasInvoiceBalance, setHasInvoiceBalance] = useState<string | undefined>();

  const queryParams: Record<string, unknown> = {
    page: 1,
    limit: 100,
    search: search || undefined,
    status,
    pricingCategory,
    hasGallonOutstanding: hasGallonOutstanding === 'true' ? 'true' : undefined,
    hasInvoiceBalance: hasInvoiceBalance === 'true' ? 'true' : undefined,
  };

  if (dateRange) {
    queryParams.startDate = dateRange[0].toISOString();
    queryParams.endDate = dateRange[1].toISOString();
  }

  const { data, isLoading } = useQuery({
    queryKey: ['reports-customers', queryParams],
    queryFn: () => reportApi.customers(queryParams).then((r) => r.data.data),
  });

  const { data: tiersData } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => pricingTierApi.list().then((r) => r.data.data),
  });

  const rows: CustomerReportRow[] = data?.customers ?? [];
  const outstanding = data?.outstanding;
  const statusCounts = data?.statusCounts ?? [];

  const exportRows = () =>
    rows.map((row) => [
      row.customer.fullName,
      row.customer.phone,
      getTierLabel(row.pricingTier ?? row.customer.pricingCategory),
      row.outstandingSlim,
      row.outstandingRound,
      row.invoiceBalance,
      row.unpaidInvoiceCount,
      row.customer.status,
    ]);

  const handleExportCsv = () => {
    if (!rows.length) {
      message.warning('No data to export');
      return;
    }
    const headers = ['Customer', 'Phone', 'Tier', 'Slim Out', 'Round Out', 'Invoice Balance', 'Unpaid Invoices', 'Status'];
    downloadBlob(buildCsvBlob(headers, exportRows().map((r) => r.map(toDisplayValue))), 'customer-report.csv');
  };

  const handleExportPdf = () => {
    if (!rows.length) {
      message.warning('No data to export');
      return;
    }
    const headers = ['Customer', 'Phone', 'Tier', 'Slim Out', 'Round Out', 'Invoice Balance', 'Unpaid Invoices', 'Status'];
    buildPdf(
      'Customer Report',
      'Customer overview with gallon and invoice balances',
      [
        `Search: ${search || 'All'}`,
        `Status: ${status ?? 'All'}`,
        `Pricing tier: ${pricingCategory ?? 'All'}`,
        `Has gallon outstanding: ${hasGallonOutstanding ?? 'Any'}`,
        `Has invoice balance: ${hasInvoiceBalance ?? 'Any'}`,
      ],
      [
        {
          title: 'Summary',
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Customers', outstanding?.totalCustomers ?? 0],
            ['With Gallon Outstanding', outstanding?.withOutstanding ?? 0],
            ['Outstanding Slim', formatCurrency(outstanding?.outstandingSlim ?? 0)],
            ['Outstanding Round', formatCurrency(outstanding?.outstandingRound ?? 0)],
          ],
        },
        {
          title: 'Customers',
          headers,
          rows: exportRows().map((r) => r.map(toDisplayValue)),
        },
      ],
      'customer-report.pdf',
    );
  };

  return (
    <div>
      <Space className="mb-16" wrap>
        <Input
          placeholder="Search name, phone, address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 140 }}
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Enabled', value: 'enabled' },
            { label: 'Disabled', value: 'disabled' },
          ]}
        />
        <Select
          allowClear
          placeholder="Pricing tier"
          style={{ width: 160 }}
          value={pricingCategory}
          onChange={setPricingCategory}
          options={(tiersData ?? []).map((t) => ({ label: t.label, value: t._id }))}
        />
        <Select
          allowClear
          placeholder="Gallon outstanding"
          style={{ width: 170 }}
          value={hasGallonOutstanding}
          onChange={setHasGallonOutstanding}
          options={[
            { label: 'Has outstanding', value: 'true' },
          ]}
        />
        <Select
          allowClear
          placeholder="Invoice balance"
          style={{ width: 170 }}
          value={hasInvoiceBalance}
          onChange={setHasInvoiceBalance}
          options={[
            { label: 'Has balance', value: 'true' },
          ]}
        />
        <Button onClick={handleExportCsv}>Export CSV</Button>
        <Button onClick={handleExportPdf}>Export PDF</Button>
      </Space>

      {outstanding && (
        <Row gutter={16} className="mb-16">
          <Col span={6}><Statistic title="Total Customers" value={outstanding.totalCustomers} /></Col>
          <Col span={6}><Statistic title="With Gallon Outstanding" value={outstanding.withOutstanding} /></Col>
          <Col span={6}><Statistic title="Outstanding Slim" value={outstanding.outstandingSlim} /></Col>
          <Col span={6}><Statistic title="Outstanding Round" value={outstanding.outstandingRound} /></Col>
        </Row>
      )}

      <Table
        loading={isLoading}
        dataSource={rows}
        rowKey={(row) => row.customer._id}
        pagination={false}
        className="mb-16"
        columns={[
          { title: 'Customer', render: (_: unknown, r: CustomerReportRow) => r.customer.fullName },
          { title: 'Phone', render: (_: unknown, r: CustomerReportRow) => r.customer.phone },
          { title: 'Tier', render: (_: unknown, r: CustomerReportRow) => getTierLabel(r.pricingTier ?? r.customer.pricingCategory) },
          { title: 'Slim Out', dataIndex: 'outstandingSlim' },
          { title: 'Round Out', dataIndex: 'outstandingRound' },
          {
            title: 'Invoice Balance',
            render: (_: unknown, r: CustomerReportRow) => formatCurrency(r.invoiceBalance),
          },
          { title: 'Unpaid Invoices', dataIndex: 'unpaidInvoiceCount' },
          {
            title: 'Status',
            render: (_: unknown, r: CustomerReportRow) => (
              <Tag color={r.customer.status === 'enabled' ? 'green' : 'default'}>{r.customer.status}</Tag>
            ),
          },
        ]}
      />

      <Table
        dataSource={statusCounts}
        rowKey="_id"
        pagination={false}
        size="small"
        title={() => 'Status Breakdown'}
        columns={[
          { title: 'Status', dataIndex: '_id' },
          { title: 'Count', dataIndex: 'count' },
        ]}
      />
    </div>
  );
};
