import { useState } from 'react';
import {
  Button,
  Select,
  Tag,
  Space,
  Form,
  Input,
  InputNumber,
  Switch,
  DatePicker,
  Segmented,
  Calendar,
  Badge,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import { deliveryApi, customerApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { PageHeader } from '@/components/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { DeliveryColorDot } from '@/components/DeliveryColorDot';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterDeliveryChange } from '@/utils/invalidateBusinessQueries';
import { SCHEDULE_OPTIONS } from '@/utils/constants';
import type { Delivery, Customer } from '@/types';

export const DeliveriesPage = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange } = usePagination();
  const { search, setSearch, debouncedSearch } = useSearchFromUrl();
  const [view, setView] = useState<string>('list');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Delivery | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', page, limit, debouncedSearch, statusFilter, view],
    queryFn: () =>
      deliveryApi
        .list({
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter,
          view: view === 'list' ? undefined : view,
        })
        .then((r) => r.data),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => customerApi.list({ page: 1, limit: 200, status: 'enabled' }).then((r) => r.data.data),
  });

  const { data: calendarEvents } = useQuery({
    queryKey: ['deliveries-calendar'],
    queryFn: () =>
      deliveryApi
        .calendar(dayjs().startOf('month').toISOString(), dayjs().endOf('month').toISOString())
        .then((r) => r.data.data),
    enabled: view === 'calendar',
  });

  const { control, handleSubmit, reset, formState: { errors: _errors } } = useForm({
    defaultValues: {
      customerId: '',
      date: dayjs(),
      schedule: 'Daily',
      status: 'pending',
      colorCode: 'white',
      remarks: '',
      discount: 0,
      paid: false,
      slimOut: 0,
      roundOut: 0,
      slimReturn: 0,
      roundReturn: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing ? deliveryApi.update(editing._id, payload) : deliveryApi.create(payload),
    onSuccess: () => {
      message.success(editing ? 'Delivery updated' : 'Delivery created');
      invalidateAfterDeliveryChange(queryClient);
      setModalOpen(false);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to save delivery')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deliveryApi.delete(id),
    onSuccess: () => {
      message.success('Delivery deleted');
      invalidateAfterDeliveryChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete delivery')),
  });

  const openModal = (record?: Delivery) => {
    setEditing(record || null);
    reset(
      record
        ? { ...record, date: dayjs(record.date), customerId: typeof record.customerId === 'object' ? record.customerId._id : record.customerId }
        : { customerId: '', date: dayjs(), schedule: 'Daily', status: 'pending', colorCode: 'white', remarks: '', discount: 0, paid: false, slimOut: 0, roundOut: 0, slimReturn: 0, roundReturn: 0 },
    );
    setModalOpen(true);
  };

  const onSubmit = (formData: Record<string, unknown>) => {
    saveMutation.mutate({
      ...formData,
      date: (formData.date as dayjs.Dayjs).toISOString(),
    });
  };

  const getListData = (value: dayjs.Dayjs) => {
    const dayEvents = (calendarEvents || []).filter((e) => dayjs(e.date).isSame(value, 'day'));
    return dayEvents.map((e) => ({
      type: e.status === 'delivered' ? 'success' : e.status === 'overdue' ? 'error' : 'warning',
      content: typeof e.customerId === 'object' ? e.customerId.fullName : 'Delivery',
    }));
  };

  const columns = [
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
      render: (s: string) => <Tag color={getStatusColor(s)}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Color',
      key: 'colorCode',
      render: (_: unknown, r: Delivery) => (
        <DeliveryColorDot status={r.status} date={r.date} colorCode={r.colorCode} />
      ),
    },
    { title: 'Paid', dataIndex: 'paid', render: (p: boolean) => (p ? <Tag color="success">Yes</Tag> : <Tag>No</Tag>) },
    {
      title: 'Actions',
      render: (_: unknown, r: Delivery) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title="Delete?" onConfirm={() => deleteMutation.mutate(r._id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Manage delivery schedules and routes"
        refreshQueryKeys={['deliveries', 'customers-select']}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            New Delivery
          </Button>
        }
      />

      <Space className="mb-16 filter-toolbar" wrap>
        <Input
          placeholder="Search customer or schedule..."
          prefix={<SearchOutlined />}
          allowClear
          className="w-280"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Segmented
          options={[
            { label: 'List', value: 'list' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Calendar', value: 'calendar' },
          ]}
          value={view}
          onChange={setView}
        />
        <Select
          placeholder="Status"
          allowClear
          className="w-140"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Delivered', value: 'delivered' },
            { label: 'Pending', value: 'pending' },
            { label: 'Overdue', value: 'overdue' },
          ]}
        />
        <div className="delivery-color-legend">
          <span className="delivery-color-legend__item">
            <span className="status-dot status-dot--white" /> On schedule
          </span>
          <span className="delivery-color-legend__item">
            <span className="status-dot status-dot--orange" /> Overdue 2 days
          </span>
          <span className="delivery-color-legend__item">
            <span className="status-dot status-dot--red" /> Overdue 3+ days
          </span>
        </div>
      </Space>

      {view === 'calendar' ? (
        <Calendar
          cellRender={(date) => {
            const listData = getListData(date);
            return (
              <ul className="list-reset">
                {listData.map((item, i) => (
                  <li key={i}>
                    <Badge status={item.type as 'success' | 'warning' | 'error'} text={item.content} />
                  </li>
                ))}
              </ul>
            );
          }}
        />
      ) : (
        <BaseTable
          dataSource={data?.data}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
        />
      )}

      <BaseModal
        title={editing ? 'Edit Delivery' : 'Record Delivery'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit(onSubmit)}
        width={640}
        confirmLoading={saveMutation.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="Customer">
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  showSearch
                  optionFilterProp="label"
                  options={(customers || []).map((c: Customer) => ({ label: c.fullName, value: c._id }))}
                />
              )}
            />
          </Form.Item>
          <Form.Item label="Date">
            <Controller name="date" control={control} render={({ field }) => <DatePicker {...field} className="w-full" />} />
          </Form.Item>
          <Form.Item label="Schedule">
            <Controller
              name="schedule"
              control={control}
              render={({ field }) => <Select {...field} options={SCHEDULE_OPTIONS.map((s) => ({ label: s, value: s }))} />}
            />
          </Form.Item>
          <Space wrap className="space-full">
            <Form.Item label="Slim Out"><Controller name="slimOut" control={control} render={({ field }) => <InputNumber {...field} min={0} />} /></Form.Item>
            <Form.Item label="Round Out"><Controller name="roundOut" control={control} render={({ field }) => <InputNumber {...field} min={0} />} /></Form.Item>
            <Form.Item label="Slim Return"><Controller name="slimReturn" control={control} render={({ field }) => <InputNumber {...field} min={0} />} /></Form.Item>
            <Form.Item label="Round Return"><Controller name="roundReturn" control={control} render={({ field }) => <InputNumber {...field} min={0} />} /></Form.Item>
          </Space>
          <Form.Item label="Discount">
            <Controller name="discount" control={control} render={({ field }) => <InputNumber {...field} min={0} prefix="₱" className="w-full" />} />
          </Form.Item>
          <Form.Item label="Remarks">
            <Controller name="remarks" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
          </Form.Item>
          <Form.Item label="Paid">
            <Controller name="paid" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
          </Form.Item>
          <Form.Item label="Status">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Overdue', value: 'overdue' },
                  ]}
                />
              )}
            />
          </Form.Item>
        </Form>
      </BaseModal>
    </div>
  );
};
