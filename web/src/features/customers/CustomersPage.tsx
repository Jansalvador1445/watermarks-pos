import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Space,
  Switch,
  Upload,
  message,
  Popconfirm,
  Tag,
  Avatar,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { PageHeader } from '@/components/PageHeader';
import { MobileListCard } from '@/components/MobileListCard';
import { CustomerFormModal } from '@/components/CustomerFormModal';
import { usePagination } from '@/hooks/usePagination';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterCustomerChange } from '@/utils/invalidateBusinessQueries';
import { formatCoordinates, getCustomerMapsUrl, hasValidCoordinates } from '@/utils/locationLink';
import { getTierLabel } from '@/utils/pricingTier';
import type { Customer } from '@/types';

const { Text } = Typography;

export const CustomersPage = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange, reset } = usePagination();
  const { search, setSearch, debouncedSearch } = useSearchFromUrl();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, limit, debouncedSearch, statusFilter],
    queryFn: () =>
      customerApi.list({ page, limit, search: debouncedSearch, status: statusFilter }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      message.success('Customer deleted');
      invalidateAfterCustomerChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete customer')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => customerApi.toggleStatus(id),
    onSuccess: () => invalidateAfterCustomerChange(queryClient),
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to update status')),
  });

  const importMutation = useMutation({
    mutationFn: (customers: Partial<Customer>[]) => customerApi.import(customers),
    onSuccess: (res) => {
      message.success(`Imported ${res.data.data.imported} customers`);
      invalidateAfterCustomerChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to import customers')),
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record: Customer) => {
    setEditing(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleCSVImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1);
      const customers = lines
        .filter((l) => l.trim())
        .map((line) => {
          const [fullName, address, phone] = line.split(',');
          return { fullName: fullName?.trim(), address: address?.trim(), phone: phone?.trim() };
        });
      importMutation.mutate(customers);
    };
    reader.readAsText(file);
    return false;
  };

  const columns = [
    { title: 'Full Name', dataIndex: 'fullName', sorter: true },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Address', dataIndex: 'address', ellipsis: true },
    {
      title: 'Pricing Category',
      dataIndex: 'pricingCategory',
      render: (tier: Customer['pricingCategory']) => <Tag>{getTierLabel(tier)}</Tag>,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, r: Customer) => {
        if (hasValidCoordinates(r.latitude, r.longitude)) {
          const mapsUrl = getCustomerMapsUrl(r);
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary" className="text-xs">
                {formatCoordinates(r.latitude, r.longitude)}
              </Text>
              {mapsUrl && (
                <Button type="link" size="small" icon={<LinkOutlined />} href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  Open Map
                </Button>
              )}
            </Space>
          );
        }
        if (r.manualLocation?.trim()) {
          return (
            <Text type="secondary" className="text-xs">
              {r.manualLocation}
            </Text>
          );
        }
        if (r.locationNotes?.trim()) {
          return (
            <Text type="secondary" className="text-xs">
              {r.locationNotes}
            </Text>
          );
        }
        return '—';
      },
    },
    {
      title: 'Photo',
      dataIndex: 'propertyPhotoUrl',
      render: (url: string) =>
        url ? <Avatar shape="square" size={40} src={url} alt="Property" /> : '—',
    },
    { title: 'Outstanding Slim', dataIndex: 'outstandingSlim', render: (v: number) => v ?? 0 },
    { title: 'Outstanding Round', dataIndex: 'outstandingRound', render: (v: number) => v ?? 0 },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string, r: Customer) => (
        <Switch
          checked={s === 'enabled'}
          onChange={() => toggleMutation.mutate(r._id)}
          checkedChildren="On"
          unCheckedChildren="Off"
        />
      ),
    },
    {
      title: 'Actions',
      render: (_: unknown, r: Customer) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this customer?" onConfirm={() => deleteMutation.mutate(r._id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database"
        refreshQueryKeys={['customers', 'pricing-tiers']}
        extra={
          <div className="page-header__actions">
            <Upload beforeUpload={handleCSVImport} accept=".csv" showUploadList={false}>
              <Button icon={<UploadOutlined />} className="page-header__action-btn">
                Import CSV
              </Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="page-header__action-btn">
              Add Customer
            </Button>
          </div>
        }
      />

      <div className="filter-toolbar mb-16">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search customers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
          className="w-280"
          allowClear
        />
        <Select
          placeholder="Status"
          allowClear
          className="w-140"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            reset();
          }}
          options={[
            { label: 'Enabled', value: 'enabled' },
            { label: 'Disabled', value: 'disabled' },
          ]}
        />
      </div>

      <BaseTable
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        renderMobileItem={(record) => (
          <MobileListCard
            title={record.fullName}
            subtitle={record.phone}
            fields={[
              { label: 'Address', value: record.address },
              { label: 'Pricing', value: getTierLabel(record.pricingCategory) },
              {
                label: 'Status',
                value: (
                  <Switch
                    checked={record.status === 'enabled'}
                    onChange={() => toggleMutation.mutate(record._id)}
                    checkedChildren="On"
                    unCheckedChildren="Off"
                  />
                ),
              },
            ]}
            actions={
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} aria-label="Edit customer" />
                <Popconfirm title="Delete this customer?" onConfirm={() => deleteMutation.mutate(record._id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete customer" />
                </Popconfirm>
              </Space>
            }
          />
        )}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.pagination?.total,
          onChange: onPageChange,
        }}
      />

      <CustomerFormModal open={modalOpen} onClose={closeModal} editing={editing} />
    </div>
  );
};
