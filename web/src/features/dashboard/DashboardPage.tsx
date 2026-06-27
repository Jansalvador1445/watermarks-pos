import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Tag, Timeline, Button, Segmented, Select, Typography, Empty, App, Space } from 'antd';
import {
  TeamOutlined,
  CarOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi, backupApi } from '@/services/api';
import { StatCard } from '@/components/StatCard';
import { StorageOverview } from '@/components/StorageOverview';
import { PageRefreshButton } from '@/components/PageRefreshButton';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/utils/formatters';
import { DeliveryColorDot } from '@/components/DeliveryColorDot';
import type { Delivery, Transaction } from '@/types';

const { Title } = Typography;

const SALES_PERIODS = [
  { label: 'Days', value: 'daily' },
  { label: 'Weeks', value: 'weekly' },
  { label: 'Months', value: 'monthly' },
  { label: 'Years', value: 'yearly' },
];

const formatTransactionType = (type: string) => {
  const map: Record<string, string> = {
    walkin: 'Walk-in',
    delivery: 'Delivery',
    pos: 'POS',
  };
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const formatPayment = (method: string) => {
  const map: Record<string, string> = {
    cash: 'Cash',
    gcash: 'GCash',
    bank: 'Bank Transfer',
  };
  return map[method] || method.toUpperCase();
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [salesRange, setSalesRange] = useState('this-month');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data.data),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard', 'sales', salesPeriod, salesRange],
    queryFn: () => dashboardApi.sales(salesPeriod, salesRange).then((r) => r.data.data),
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ['dashboard', 'deliveries'],
    queryFn: () => dashboardApi.deliveries().then((r) => r.data.data),
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: () => dashboardApi.inventory().then((r) => r.data.data),
  });

  const { data: recentDeliveries } = useQuery({
    queryKey: ['dashboard', 'recent-deliveries'],
    queryFn: () => dashboardApi.recentDeliveries().then((r) => r.data.data),
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: () => dashboardApi.recentTransactions().then((r) => r.data.data),
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['dashboard', 'top-customers'],
    queryFn: () => dashboardApi.topCustomers().then((r) => r.data.data),
  });

  const { data: activityLogs } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => dashboardApi.activity().then((r) => r.data.data),
  });

  const { data: systemSummary } = useQuery({
    queryKey: ['dashboard', 'system-summary'],
    queryFn: () => dashboardApi.systemSummary().then((r) => r.data.data),
  });

  const backupMutation = useMutation({
    mutationFn: () => backupApi.create(),
    onSuccess: () => {
      message.success('Backup created successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'system-summary'] });
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: () => message.error('Failed to create backup'),
  });

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const deliveryTotal = deliveriesData?.total ?? 0;
  const pieData = (deliveriesData?.breakdown || []).filter((item) => item.value > 0);
  const hasPieData = pieData.length > 0;
  const hasSalesData = (salesData || []).some((point) => point.total > 0);

  const deliveryColumns = [
    { title: 'Date', dataIndex: 'date', render: (d: string) => formatDate(d) },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      render: (c: Delivery['customerId']) => (typeof c === 'object' ? c.fullName : '-'),
    },
    { title: 'Schedule', dataIndex: 'schedule' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={getStatusColor(s)} className="dashboard-status-tag">
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Color Coding',
      key: 'colorCode',
      render: (_: unknown, r: Delivery) => (
        <DeliveryColorDot status={r.status} date={r.date} colorCode={r.colorCode} showLabel />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 64,
      render: (_: unknown, r: Delivery) => (
        <Button
          type="text"
          size="small"
          className="dashboard-action-btn"
          icon={<EyeOutlined />}
          aria-label="View delivery"
          onClick={() => navigate('/deliveries', { state: { highlightId: r._id } })}
        />
      ),
    },
  ];

  const transactionColumns = [
    { title: 'Date', dataIndex: 'createdAt', render: (d: string) => formatDate(d) },
    { title: 'Type', dataIndex: 'type', render: (t: string) => formatTransactionType(t) },
    {
      title: 'Customer',
      render: (_: unknown, r: Transaction) =>
        typeof r.customerId === 'object' ? r.customerId?.fullName : r.customerName || 'Walk-in',
    },
    { title: 'Amount', dataIndex: 'amount', render: (a: number) => formatCurrency(a) },
    { title: 'Payment', dataIndex: 'paymentMethod', render: (p: string) => formatPayment(p) },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={getStatusColor(s)} className="dashboard-status-tag">
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <Title level={2} className="dashboard-header__title">
            Dashboard
          </Title>
          <p className="dashboard-header__subtitle">
            Welcome back, {firstName}! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <Space wrap>
          <PageRefreshButton targets={['dashboard']} />
          <Button icon={<CalendarOutlined />} className="dashboard-date-btn">
            {formatDate(new Date())}
          </Button>
        </Space>
      </div>

      <div className="dashboard-stats-row">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={<TeamOutlined />}
          iconVariant="blue"
          subtext={`+${stats?.newCustomersThisMonth ?? 0} this month`}
          subtextTone="success"
          loading={statsLoading}
          index={0}
        />
        <StatCard
          title="Today's Deliveries"
          value={stats?.todayDeliveries ?? 0}
          icon={<CarOutlined />}
          iconVariant="green"
          subtext={`${stats?.deliveredToday ?? 0} Delivered`}
          subtextTone="success"
          loading={statsLoading}
          index={1}
        />
        <StatCard
          title="Overdue Deliveries"
          value={stats?.overdueDeliveries ?? 0}
          icon={<CalendarOutlined />}
          iconVariant="red"
          subtext="3 days or more"
          subtextTone="danger"
          loading={statsLoading}
          valueClassName="stat-card__value stat-card__value--danger"
          index={2}
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales ?? 0)}
          icon={<DollarOutlined />}
          iconVariant="gold"
          subtext={`${(stats?.salesGrowth ?? 0) >= 0 ? '+' : ''}${stats?.salesGrowth ?? 0}% vs yesterday`}
          subtextTone="success"
          loading={statsLoading}
          index={3}
        />
        <StatCard
          title="This Month Sales"
          value={formatCurrency(stats?.monthSales ?? 0)}
          icon={<BarChartOutlined />}
          iconVariant="purple"
          subtext={`${(stats?.monthGrowth ?? 0) >= 0 ? '+' : ''}${stats?.monthGrowth ?? 0}% vs last month`}
          subtextTone="success"
          loading={statsLoading}
          index={4}
        />
      </div>

      <Row gutter={[20, 20]} className="mt-24">
        <Col xs={24} xl={8}>
          <Card
            title="Sales Overview"
            bordered={false}
            className="card-rounded dashboard-chart-card dashboard-panel-card"
            extra={
              <div className="dashboard-chart-card__controls">
                <Segmented
                  size="small"
                  options={SALES_PERIODS}
                  value={salesPeriod}
                  onChange={(v) => setSalesPeriod(v as string)}
                />
                <Select
                  value={salesRange}
                  size="small"
                  className="dashboard-chart-card__select"
                  onChange={setSalesRange}
                  options={[
                    { value: 'this-month', label: 'This Month' },
                    { value: 'last-month', label: 'Last Month' },
                  ]}
                />
              </div>
            }
          >
            <div className="dashboard-chart-wrap">
              {salesLoading ? (
                <div className="dashboard-chart-wrap__loading" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={salesData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#8c8c8c' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8c8c8c' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₱${v}`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="dashboard-chart-tooltip">
                            <div className="dashboard-chart-tooltip__date">{label}</div>
                            <div className="dashboard-chart-tooltip__value">
                              {formatCurrency(Number(payload[0]?.value ?? 0))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#1677ff"
                      strokeWidth={2.5}
                      dot={hasSalesData ? { r: 4, fill: '#1677ff', strokeWidth: 2, stroke: '#fff' } : false}
                      activeDot={hasSalesData ? { r: 6 } : false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {!salesLoading && !hasSalesData && (
                <div className="dashboard-chart-empty">No sales recorded for this period</div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Deliveries Overview" bordered={false} className="card-rounded dashboard-chart-card dashboard-panel-card">
            <div className="deliveries-donut">
              <div className="deliveries-donut__layout">
                <div className="deliveries-donut__chart">
                  <ResponsiveContainer width="100%" height={240}>
                    {hasPieData ? (
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={88}
                          dataKey="value"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    ) : (
                      <div className="dashboard-chart-empty">No delivery data for today</div>
                    )}
                  </ResponsiveContainer>
                  <div className="deliveries-donut__center">
                    <div className="deliveries-donut__total">{deliveryTotal}</div>
                    <div className="deliveries-donut__label">Total</div>
                  </div>
                </div>
                <div className="deliveries-legend">
                  {(deliveriesData?.breakdown || []).map((item) => {
                    const pct = deliveryTotal > 0 ? ((item.value / deliveryTotal) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={item.name} className="deliveries-legend__item">
                        <span
                          className={`deliveries-legend__dot deliveries-legend__dot--${item.name.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, 'plus')}`}
                        />
                        <span className="deliveries-legend__text">
                          {item.name}: {item.value} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <StorageOverview
            slim={inventoryData?.slim}
            round={inventoryData?.round}
            movementsToday={inventoryData?.movementsToday}
            loading={inventoryLoading}
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="mt-24">
        <Col xs={24} lg={12}>
          <Card title="Recent Deliveries" bordered={false} className="card-rounded dashboard-panel-card">
            <Table
              dataSource={recentDeliveries}
              columns={deliveryColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              scroll={{ x: true }}
              className="dashboard-table"
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No deliveries yet" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Transactions" bordered={false} className="card-rounded dashboard-panel-card">
            <Table
              dataSource={recentTransactions}
              columns={transactionColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              scroll={{ x: true }}
              className="dashboard-table"
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No transactions yet" /> }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="mt-24">
        <Col xs={24} md={8}>
          <Card title="Top Customers This Month" bordered={false} className="card-rounded dashboard-panel-card">
            {(topCustomers || []).length > 0 ? (
              topCustomers!.map((c, i) => (
                <div key={i} className="top-customer-row">
                  <div className="top-customer-row__left">
                    <span className="top-customer-row__rank">{i + 1}</span>
                    <span>{c.fullName}</span>
                  </div>
                  <span className="top-customer-row__amount">{formatCurrency(c.totalSpent)}</span>
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No customer sales this month" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Activity Logs" bordered={false} className="card-rounded dashboard-panel-card">
            {(activityLogs || []).length > 0 ? (
              <Timeline
                className="dashboard-timeline"
                items={(activityLogs || []).slice(0, 6).map((log) => ({
                  color: '#1677ff',
                  children: (
                    <div>
                      <div className="activity-log-title">
                        <strong>{log.userId?.name || 'System'}</strong> {log.action}
                      </div>
                      <div className="activity-log-time">{formatDateTime(log.createdAt)}</div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No activity yet" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="System Summary" bordered={false} className="card-rounded dashboard-panel-card">
            <div className="flex-col gap-12">
              <div className="summary-row">
                <span>Active Products</span>
                <strong>{systemSummary?.totalProducts ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>Inventory Items</span>
                <strong>{systemSummary?.totalInventoryItems ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>Low Stock Items</span>
                <strong>{systemSummary?.lowStockItems ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>Movements Today</span>
                <strong>{systemSummary?.movementsToday ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>Outstanding Gallons</span>
                <strong>
                  Slim {systemSummary?.outstandingSlim ?? 0} / Round {systemSummary?.outstandingRound ?? 0}
                </strong>
              </div>
              <div className="summary-row">
                <span>Total Users</span>
                <strong>{systemSummary?.totalUsers ?? 0}</strong>
              </div>
              <div className="summary-row">
                <span>Database Size</span>
                <strong>{systemSummary?.databaseSize ?? '—'}</strong>
              </div>
              <div className="summary-row">
                <span>Last Backup</span>
                <strong>
                  {systemSummary?.lastBackup ? formatDateTime(systemSummary.lastBackup) : '—'}
                </strong>
              </div>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                block
                className="dashboard-backup-btn"
                loading={backupMutation.isPending}
                onClick={() => backupMutation.mutate()}
              >
                Backup Now
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
