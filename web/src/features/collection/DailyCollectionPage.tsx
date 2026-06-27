import { useState } from 'react';
import { Card, Col, Row, DatePicker, Tag, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { collectionApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

export const DailyCollectionPage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const { data, isLoading } = useQuery({
    queryKey: ['collection', 'daily', selectedDate.format('YYYY-MM-DD')],
    queryFn: () => collectionApi.daily(selectedDate.format('YYYY-MM-DD')).then((r) => r.data.data),
  });

  const columns = [
    { title: 'Customer', dataIndex: 'customer' },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (v: string) => v.charAt(0).toUpperCase() + v.slice(1),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      render: (v: string) => (v === 'pending' ? 'Unpaid' : v.toUpperCase()),
    },
    {
      title: 'Status',
      dataIndex: 'paid',
      render: (paid: boolean) => (
        <Tag color={paid ? 'green' : 'orange'}>{paid ? 'PAID' : 'UNPAID'}</Tag>
      ),
    },
    {
      title: 'Staff',
      dataIndex: 'staff',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Date/Time',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Daily Collection"
        subtitle="Track daily cash, GCash, and bank collections"
        refreshQueryKeys={['collection']}
        extra={
          <DatePicker
            value={selectedDate}
            onChange={(d) => d && setSelectedDate(d)}
            allowClear={false}
          />
        }
      />

      <Row gutter={[16, 16]} className="mb-16">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="card-rounded">
            <Statistic title="Cash" value={data?.summary.cash || 0} prefix="₱" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="card-rounded">
            <Statistic title="GCash" value={data?.summary.gcash || 0} prefix="₱" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="card-rounded">
            <Statistic title="Bank Transfer" value={data?.summary.bank || 0} prefix="₱" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="card-rounded">
            <Statistic
              title="Total Collected"
              value={data?.summary.total || 0}
              prefix="₱"
              precision={2}
              valueStyle={{ color: '#1677FF' }}
            />
          </Card>
        </Col>
      </Row>

      {data && data.unpaidTotal > 0 && (
        <Card bordered={false} className="card-rounded mb-16">
          <Statistic
            title="Unpaid Deliveries Today"
            value={data.unpaidTotal}
            prefix="₱"
            precision={2}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      )}

      <BaseTable
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};
