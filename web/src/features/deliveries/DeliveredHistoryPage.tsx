import { useState } from 'react';
import { Select, Tag, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { deliveryApi, userApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { PageHeader } from '@/components/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { usePermission } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';
import type { Customer, Delivery, User } from '@/types';

export const DeliveredHistoryPage = () => {
  const { page, limit, onPageChange } = usePagination();
  const { isAdmin } = usePermission();
  const [staffFilter, setStaffFilter] = useState<string | undefined>();

  const { data: staffData } = useQuery({
    queryKey: ['users', 'delivery-staff'],
    queryFn: () => userApi.list({ page: 1, limit: 100, role: 'delivery_staff' }).then((r) => r.data),
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', 'history', page, limit, staffFilter],
    queryFn: () =>
      deliveryApi.history({ page, limit, staffId: staffFilter }).then((r) => r.data),
  });

  const staffOptions =
    staffData?.data?.map((u: User & { _id: string }) => ({
      label: u.name,
      value: u._id || u.id,
    })) || [];

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, r: Delivery) =>
        typeof r.customerId === 'object' ? (r.customerId as Customer).fullName : '—',
    },
    {
      title: 'Slim Out',
      dataIndex: 'slimOut',
    },
    {
      title: 'Round Out',
      dataIndex: 'roundOut',
    },
    {
      title: 'Paid',
      dataIndex: 'paid',
      render: (paid: boolean) => <Tag color={paid ? 'green' : 'orange'}>{paid ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Staff',
      key: 'staff',
      render: (_: unknown, r: Delivery) => {
        const staff = r.assignedStaffId;
        if (typeof staff === 'object' && staff) return staff.name;
        return '—';
      },
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      render: (v?: string) => v || '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Delivered History"
        subtitle={isAdmin ? 'View completed deliveries by staff' : 'Your completed delivery records'}
        refreshQueryKeys={['deliveries', 'users']}
      />

      {isAdmin && (
        <Space className="mb-16" wrap>
          <Select
            allowClear
            placeholder="Filter by delivery staff"
            style={{ width: 240 }}
            value={staffFilter}
            onChange={setStaffFilter}
            options={staffOptions}
          />
        </Space>
      )}

      <BaseTable
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
      />
    </div>
  );
};
