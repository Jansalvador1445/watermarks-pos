import { useState } from 'react';
import { Card, Tabs, DatePicker, Button, Space, Table, message, Typography, Row, Col, Statistic } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

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

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [activeTab, setActiveTab] = useState('sales');

  const startDate = dateRange[0].toISOString();
  const endDate = dateRange[1].toISOString();
  const showDatePicker = activeTab === 'sales' || activeTab === 'deliveries' || activeTab === 'inventory';

  const { data: salesReport } = useQuery({
    queryKey: ['reports-sales', startDate, endDate],
    queryFn: () => reportApi.sales(startDate, endDate).then((r) => r.data.data),
    enabled: activeTab === 'sales',
  });

  const { data: deliveryReport } = useQuery({
    queryKey: ['reports-deliveries', startDate, endDate],
    queryFn: () => reportApi.deliveries(startDate, endDate).then((r) => r.data.data),
    enabled: activeTab === 'deliveries',
  });

  const { data: customerReport } = useQuery({
    queryKey: ['reports-customers'],
    queryFn: () => reportApi.customers().then((r) => r.data.data),
    enabled: activeTab === 'customers',
  });

  const { data: inventoryReport } = useQuery({
    queryKey: ['reports-inventory', startDate, endDate],
    queryFn: () => reportApi.inventory(startDate, endDate).then((r) => r.data.data),
    enabled: activeTab === 'inventory',
  });

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data?.length) {
      message.warning('No data to export');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const inventoryItems = inventoryReport?.items ?? [];
  const movementSummary = inventoryReport?.movementSummary ?? [];
  const recentMovements = inventoryReport?.recentMovements ?? [];
  const customerOutstanding = customerReport?.outstanding;
  const customerStatusCounts = customerReport?.statusCounts ?? customerReport ?? [];

  const tabItems = [
    {
      key: 'sales',
      label: 'Sales',
      children: (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesReport || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis tickFormatter={(v) => `₱${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="total" fill="#1677FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Table
            dataSource={salesReport}
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
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={deliveryReport || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label>
              {(deliveryReport || []).map((_: unknown, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'customers',
      label: 'Customers',
      children: (
        <>
          {customerOutstanding && (
            <Row gutter={16} className="mb-16">
              <Col span={6}><Statistic title="Total Customers" value={customerOutstanding.totalCustomers} /></Col>
              <Col span={6}><Statistic title="With Outstanding" value={customerOutstanding.withOutstanding} /></Col>
              <Col span={6}><Statistic title="Outstanding Slim" value={customerOutstanding.outstandingSlim} /></Col>
              <Col span={6}><Statistic title="Outstanding Round" value={customerOutstanding.outstandingRound} /></Col>
            </Row>
          )}
          <Table
            dataSource={Array.isArray(customerStatusCounts) ? customerStatusCounts : []}
            columns={[
              { title: 'Status', dataIndex: '_id' },
              { title: 'Count', dataIndex: 'count' },
            ]}
            rowKey="_id"
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'inventory',
      label: 'Inventory',
      children: (
        <>
          <Typography.Title level={5}>Current Stock</Typography.Title>
          <Table
            dataSource={inventoryItems}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              { title: 'Type', dataIndex: 'type' },
              { title: 'Stock', dataIndex: 'currentStock' },
              { title: 'Threshold', dataIndex: 'lowStockThreshold' },
              {
                title: 'Status',
                render: (_: unknown, r: { currentStock: number; lowStockThreshold: number }) =>
                  r.currentStock <= r.lowStockThreshold ? 'LOW' : 'OK',
              },
            ]}
            rowKey="_id"
            pagination={false}
            className="mb-24"
          />
          <Typography.Title level={5}>Movement Summary (Selected Period)</Typography.Title>
          <Table
            dataSource={movementSummary}
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
            dataSource={recentMovements}
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

  const getExportData = (): Record<string, unknown>[] => {
    switch (activeTab) {
      case 'sales':
        return (salesReport as Record<string, unknown>[]) || [];
      case 'deliveries':
        return (deliveryReport as Record<string, unknown>[]) || [];
      case 'customers':
        return (Array.isArray(customerStatusCounts) ? customerStatusCounts : []) as Record<string, unknown>[];
      case 'inventory':
        return (inventoryItems as Record<string, unknown>[]) || [];
      default:
        return [];
    }
  };

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
          <Button icon={<DownloadOutlined />} onClick={() => exportCSV(getExportData(), `${activeTab}-report`)}>
            Export CSV
          </Button>
        </Space>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};
