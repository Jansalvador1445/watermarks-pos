import { useMemo, useState } from 'react';
import {
  Card,
  Tabs,
  DatePicker,
  Button,
  Space,
  Table,
  message,
  Typography,
  Select,
  Input,
  InputNumber,
  Segmented,
  Tag,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { InvoiceReportsPanel } from './InvoiceReportsPanel';
import { CustomerReportsPanel } from './CustomerReportsPanel';
import { buildCsvBlob, buildPdf, downloadBlob, toDisplayValue, type PdfSection } from './reportExport';

const COLORS = ['#1677FF', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

const MOVEMENT_LABELS: Record<string, string> = {
  production: 'Production',
  delivery: 'Delivery',
  pos_sale: 'POS Sale',
  walkin_sale: 'Walk-in Sale',
  invoice_sale: 'Invoice Sale',
  return: 'Return',
  adjustment: 'Adjustment',
};

const SALES_PERIODS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
] as const;

const STOCK_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Low stock', value: 'low' },
  { label: 'OK', value: 'ok' },
] as const;

type SalesPeriod = (typeof SALES_PERIODS)[number]['value'];
type StockStatusFilter = (typeof STOCK_STATUS_OPTIONS)[number]['value'];

export const ReportsPage = () => {
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('daily');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [activeTab, setActiveTab] = useState('sales');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<string | undefined>();
  const [inventoryStockStatus, setInventoryStockStatus] = useState<StockStatusFilter>('all');
  const [inventoryStockMin, setInventoryStockMin] = useState<number | null>(null);
  const [inventoryStockMax, setInventoryStockMax] = useState<number | null>(null);
  const [inventoryMovementType, setInventoryMovementType] = useState<string | undefined>();

  const startDate = dateRange[0].toISOString();
  const endDate = dateRange[1].toISOString();
  const showDatePicker = ['sales', 'deliveries', 'inventory', 'invoices', 'customers'].includes(activeTab);

  const { data: salesReport } = useQuery({
    queryKey: ['reports-sales', startDate, endDate, salesPeriod],
    queryFn: () => reportApi.sales(startDate, endDate, salesPeriod).then((r) => r.data.data),
    enabled: activeTab === 'sales',
  });

  const { data: deliveryReport } = useQuery({
    queryKey: ['reports-deliveries', startDate, endDate],
    queryFn: () => reportApi.deliveries(startDate, endDate).then((r) => r.data.data),
    enabled: activeTab === 'deliveries',
  });

  const { data: inventoryReport } = useQuery({
    queryKey: ['reports-inventory', startDate, endDate],
    queryFn: () => reportApi.inventory(startDate, endDate).then((r) => r.data.data),
    enabled: activeTab === 'inventory',
  });

  const inventoryItems = inventoryReport?.items ?? [];
  const movementSummary = inventoryReport?.movementSummary ?? [];
  const recentMovements = inventoryReport?.recentMovements ?? [];
  const salesRows = salesReport ?? [];
  const deliveryRows = deliveryReport ?? [];

  const inventoryCategories = useMemo(
    () =>
      Array.from(
        new Set(
          inventoryItems
            .map((item: { category?: string }) => item.category)
            .filter((category: string | undefined): category is string => Boolean(category)),
        ),
      ).sort(),
    [inventoryItems],
  );

  const normalizedInventorySearch = inventorySearch.trim().toLowerCase();

  const filteredInventoryItems = useMemo(
    () =>
      inventoryItems.filter((item: Record<string, unknown>) => {
        const stockStatus =
          (item.currentStock as number) <= (item.lowStockThreshold as number) ? 'low' : 'ok';
        const matchesSearch =
          !normalizedInventorySearch ||
          [item.name, item.sku, item.category, item.unit, item.refillType]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(normalizedInventorySearch));
        const matchesCategory = !inventoryCategory || item.category === inventoryCategory;
        const matchesStockStatus = inventoryStockStatus === 'all' || stockStatus === inventoryStockStatus;
        const matchesStockMin = inventoryStockMin === null || (item.currentStock as number) >= inventoryStockMin;
        const matchesStockMax = inventoryStockMax === null || (item.currentStock as number) <= inventoryStockMax;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStockStatus &&
          matchesStockMin &&
          matchesStockMax
        );
      }),
    [
      inventoryItems,
      inventoryCategory,
      inventoryStockStatus,
      inventoryStockMin,
      inventoryStockMax,
      normalizedInventorySearch,
    ],
  );

  const filteredMovementSummary = useMemo(
    () => movementSummary.filter((movement: { _id?: string }) => !inventoryMovementType || movement._id === inventoryMovementType),
    [inventoryMovementType, movementSummary],
  );

  const filteredRecentMovements = useMemo(
    () =>
      recentMovements.filter((movement: Record<string, unknown>) => {
        const matchesMovementType = !inventoryMovementType || movement.movementType === inventoryMovementType;
        const matchesSearch =
          !normalizedInventorySearch ||
          [movement.referenceNo, movement.remarks, (movement.itemId as { name?: string })?.name]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(normalizedInventorySearch));
        return matchesMovementType && matchesSearch;
      }),
    [inventoryMovementType, normalizedInventorySearch, recentMovements],
  );

  const exportActiveTabToPdf = () => {
    if (activeTab === 'invoices' || activeTab === 'customers') return;

    const title = 'Reports';
    const subtitle = 'Analytics and exportable reports from live business data';
    const filterSummary = [
      `Date range: ${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`,
      ...(activeTab === 'sales' ? [`Sales grouping: ${salesPeriod}`] : []),
      ...(activeTab === 'inventory'
        ? [
            `Inventory search: ${inventorySearch || 'All'}`,
            `Category: ${inventoryCategory || 'All'}`,
            `Stock status: ${inventoryStockStatus}`,
          ]
        : []),
    ];

    const sections: PdfSection[] = [];

    if (activeTab === 'sales') {
      sections.push({
        title: 'Sales Summary',
        headers: ['Period', 'Total', 'Count'],
        rows: salesRows.map((row: { _id?: string; total?: number; count?: number }) => [
          toDisplayValue(row._id),
          formatCurrency(Number(row.total ?? 0)),
          toDisplayValue(row.count),
        ]),
      });
    }

    if (activeTab === 'deliveries') {
      sections.push({
        title: 'Deliveries Summary',
        headers: ['Status', 'Count'],
        rows: deliveryRows.map((row: { _id?: string; count?: number }) => [toDisplayValue(row._id), toDisplayValue(row.count)]),
      });
    }

    if (activeTab === 'inventory') {
      sections.push({
        title: 'Current Stock',
        headers: ['Name', 'SKU', 'Category', 'Stock', 'Threshold', 'Status'],
        rows: filteredInventoryItems.map((item: Record<string, unknown>) => [
          toDisplayValue(item.name),
          toDisplayValue(item.sku),
          toDisplayValue(item.category),
          toDisplayValue(item.currentStock),
          toDisplayValue(item.lowStockThreshold),
          (item.currentStock as number) <= (item.lowStockThreshold as number) ? 'LOW' : 'OK',
        ]),
      });
    }

    buildPdf(title, subtitle, filterSummary, sections, `${activeTab}-report.pdf`);
  };

  const exportActiveTabToCsv = () => {
    if (activeTab === 'invoices' || activeTab === 'customers') return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === 'sales') {
      headers = ['Date', 'Total', 'Count'];
      rows = salesRows.map((row: { _id?: string; total?: number; count?: number }) => [
        toDisplayValue(row._id),
        toDisplayValue(row.total),
        toDisplayValue(row.count),
      ]);
    } else if (activeTab === 'deliveries') {
      headers = ['Status', 'Count'];
      rows = deliveryRows.map((row: { _id?: string; count?: number }) => [toDisplayValue(row._id), toDisplayValue(row.count)]);
    } else if (activeTab === 'inventory') {
      headers = ['Name', 'SKU', 'Category', 'Stock', 'Threshold', 'Status'];
      rows = filteredInventoryItems.map((item: Record<string, unknown>) => [
        toDisplayValue(item.name),
        toDisplayValue(item.sku),
        toDisplayValue(item.category),
        toDisplayValue(item.currentStock),
        toDisplayValue(item.lowStockThreshold),
        (item.currentStock as number) <= (item.lowStockThreshold as number) ? 'LOW' : 'OK',
      ]);
    }

    if (!rows.length) {
      message.warning('No data to export');
      return;
    }

    downloadBlob(buildCsvBlob(headers, rows), `${activeTab}-report.csv`);
  };

  const tabItems = [
    {
      key: 'sales',
      label: 'Sales',
      children: (
        <>
          <Space className="mb-16" wrap>
            <Segmented options={[...SALES_PERIODS]} value={salesPeriod} onChange={(value) => setSalesPeriod(value as SalesPeriod)} />
          </Space>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tickMargin={12} />
              <YAxis tickFormatter={(v) => `₱${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="total" fill="#1677FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Table
            dataSource={salesRows}
            columns={[
              { title: 'Date', dataIndex: '_id' },
              { title: 'Total', dataIndex: 'total', render: (v: number) => formatCurrency(v) },
              { title: 'Count', dataIndex: 'count' },
            ]}
            rowKey="_id"
            className="mt-16"
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'deliveries',
      label: 'Deliveries',
      children: (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={deliveryRows} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label>
                {(deliveryRows || []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Table
            dataSource={deliveryRows}
            columns={[
              { title: 'Status', dataIndex: '_id', render: (value: string) => <Tag color="blue">{value}</Tag> },
              { title: 'Count', dataIndex: 'count' },
            ]}
            rowKey="_id"
            pagination={false}
            className="mt-16"
          />
        </>
      ),
    },
    {
      key: 'invoices',
      label: 'Invoices',
      children: <InvoiceReportsPanel dateRange={dateRange} />,
    },
    {
      key: 'customers',
      label: 'Customers',
      children: <CustomerReportsPanel dateRange={dateRange} />,
    },
    {
      key: 'inventory',
      label: 'Inventory',
      children: (
        <>
          <Space className="mb-16" wrap align="start">
            <Input
              placeholder="Search name, SKU, category, unit"
              value={inventorySearch}
              onChange={(event) => setInventorySearch(event.target.value)}
              allowClear
              style={{ width: 260 }}
            />
            <Select
              placeholder="Category"
              allowClear
              value={inventoryCategory}
              onChange={(value) => setInventoryCategory(value)}
              options={inventoryCategories.map((category) => ({ value: category, label: category }))}
              style={{ width: 180 }}
            />
            <Select
              placeholder="Stock status"
              value={inventoryStockStatus}
              onChange={(value) => setInventoryStockStatus(value)}
              options={STOCK_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              style={{ width: 140 }}
            />
            <InputNumber placeholder="Stock min" value={inventoryStockMin} onChange={(value) => setInventoryStockMin(value)} style={{ width: 120 }} min={0} />
            <InputNumber placeholder="Stock max" value={inventoryStockMax} onChange={(value) => setInventoryStockMax(value)} style={{ width: 120 }} min={0} />
            <Select
              placeholder="Movement type"
              allowClear
              value={inventoryMovementType}
              onChange={(value) => setInventoryMovementType(value)}
              options={Object.entries(MOVEMENT_LABELS).map(([value, label]) => ({ value, label }))}
              style={{ width: 170 }}
            />
          </Space>
          <Typography.Title level={5}>Current Stock</Typography.Title>
          <Table
            dataSource={filteredInventoryItems}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              { title: 'SKU', dataIndex: 'sku', render: (value: string) => value || '—' },
              { title: 'Category', dataIndex: 'category' },
              { title: 'Stock', dataIndex: 'currentStock' },
              { title: 'Threshold', dataIndex: 'lowStockThreshold' },
              {
                title: 'Status',
                render: (_: unknown, r: { currentStock: number; lowStockThreshold: number }) =>
                  r.currentStock <= r.lowStockThreshold ? <Tag color="warning">LOW</Tag> : <Tag color="success">OK</Tag>,
              },
            ]}
            rowKey="_id"
            pagination={false}
            className="mb-24"
          />
          <Typography.Title level={5}>Movement Summary (Selected Period)</Typography.Title>
          <Table
            dataSource={filteredMovementSummary}
            columns={[
              { title: 'Type', dataIndex: '_id', render: (t: string) => MOVEMENT_LABELS[t] || t },
              { title: 'Count', dataIndex: 'count' },
              { title: 'Net Quantity', dataIndex: 'totalQuantity' },
            ]}
            rowKey="_id"
            pagination={false}
            className="mb-24"
          />
          <Typography.Title level={5}>Recent Movements</Typography.Title>
          <Table
            dataSource={filteredRecentMovements}
            columns={[
              { title: 'Date', dataIndex: 'date', render: (d: string) => formatDateTime(d) },
              {
                title: 'Item',
                dataIndex: 'itemId',
                render: (item: { name?: string } | string) => (typeof item === 'object' ? item?.name : '—'),
              },
              { title: 'Type', dataIndex: 'movementType', render: (t: string) => MOVEMENT_LABELS[t] || t },
              { title: 'Qty', dataIndex: 'quantity' },
              { title: 'Before', dataIndex: 'beforeStock' },
              { title: 'After', dataIndex: 'afterStock' },
              { title: 'Ref', dataIndex: 'referenceNo', ellipsis: true },
            ]}
            rowKey="_id"
            scroll={{ x: 900 }}
          />
        </>
      ),
    },
  ];

  const showGlobalExport = activeTab !== 'invoices' && activeTab !== 'customers';

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Analytics and exportable reports from live business data"
        refreshQueryKeys={[{ prefix: 'reports-' }]}
      />

      <Card bordered={false} className="card-rounded">
        <Space className="mb-16" wrap>
          {showDatePicker && (
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          )}
          {showGlobalExport && (
            <>
              <Button icon={<DownloadOutlined />} onClick={exportActiveTabToCsv}>
                Export CSV
              </Button>
              <Button icon={<DownloadOutlined />} onClick={exportActiveTabToPdf}>
                Export PDF
              </Button>
            </>
          )}
        </Space>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};
