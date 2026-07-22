import { useState } from 'react';
import {
  Button,
  Input,
  Tag,
  Space,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tabs,
  Typography,
  DatePicker,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExperimentOutlined,
  ToolOutlined,
  HistoryOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { inventoryApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { PageHeader } from '@/components/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/authStore';
import type { InventoryItem, InventoryMovement } from '@/types';

const { RangePicker } = DatePicker;

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  production: 'Production',
  delivery: 'Delivery',
  pos_sale: 'POS Sale',
  walkin_sale: 'Walk-in Sale',
  invoice_sale: 'Invoice Sale',
  return: 'Return',
  adjustment: 'Adjustment',
};

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  production: 'green',
  delivery: 'blue',
  pos_sale: 'purple',
  walkin_sale: 'cyan',
  invoice_sale: 'geekblue',
  return: 'orange',
  adjustment: 'gold',
};

export const InventoryPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { page, limit, onPageChange, reset } = usePagination();
  const {
    page: movementPage,
    limit: movementLimit,
    onPageChange: onMovementPageChange,
    reset: resetMovement,
  } = usePagination();

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form] = Form.useForm();
  const [productionForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, limit, debouncedSearch, stockFilter],
    queryFn: () =>
      inventoryApi
        .list({
          page,
          limit,
          search: debouncedSearch,
          stockFilter: stockFilter === 'low' ? 'low' : undefined,
          sortBy: 'currentStock',
          sortOrder: 'asc',
        })
        .then((r) => r.data),
  });

  const movementParams: Record<string, unknown> = {
    page: movementPage,
    limit: movementLimit,
  };
  if (movementTypeFilter) movementParams.movementType = movementTypeFilter;
  if (dateRange) {
    movementParams.startDate = dateRange[0].startOf('day').toISOString();
    movementParams.endDate = dateRange[1].endOf('day').toISOString();
  }

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-movements', movementPage, movementLimit, movementTypeFilter, dateRange],
    queryFn: () => inventoryApi.movements(movementParams).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: Partial<InventoryItem>) =>
      editing ? inventoryApi.update(editing.publicId, values) : inventoryApi.create(values),
    onSuccess: () => {
      message.success(editing ? 'Updated' : 'Created');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to save inventory item')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      message.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete inventory item')),
  });

  const productionMutation = useMutation({
    mutationFn: (values: { quantity: number; remarks: string }) =>
      inventoryApi.addProduction(selectedItem!.publicId, values),
    onSuccess: () => {
      message.success('Production recorded');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProductionOpen(false);
      productionForm.resetFields();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to record production')),
  });

  const adjustMutation = useMutation({
    mutationFn: (values: { quantity: number; reason: string }) =>
      inventoryApi.manualAdjust(selectedItem!.publicId, values),
    onSuccess: () => {
      message.success('Adjustment recorded');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAdjustOpen(false);
      adjustForm.resetFields();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to record adjustment')),
  });

  const openModal = (record?: InventoryItem) => {
    setEditing(record || null);
    form.setFieldsValue(
      record || {
        name: '',
        sku: '',
        unit: 'pcs',
        category: 'general',
        price: 0,
        description: '',
        lowStockThreshold: 10,
      },
    );
    setModalOpen(true);
  };

  const openProduction = (record: InventoryItem) => {
    setSelectedItem(record);
    productionForm.resetFields();
    setProductionOpen(true);
  };

  const openAdjust = (record: InventoryItem) => {
    setSelectedItem(record);
    adjustForm.resetFields();
    setAdjustOpen(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'SKU', dataIndex: 'sku', render: (v: string) => v || '—' },
    { title: 'Unit', dataIndex: 'unit' },
    { title: 'Category', dataIndex: 'category', render: (c: string) => <Tag>{c}</Tag> },
    { title: 'Price', dataIndex: 'price', render: (v: number) => formatCurrency(v) },
    { title: 'Stock', dataIndex: 'currentStock' },
    { title: 'Low Threshold', dataIndex: 'lowStockThreshold' },
    {
      title: 'Stock Status',
      render: (_: unknown, r: InventoryItem) => (
        <Tag color={r.currentStock <= r.lowStockThreshold ? 'warning' : 'success'}>
          {r.currentStock <= r.lowStockThreshold ? 'LOW STOCK' : 'OK'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_: unknown, r: InventoryItem) => (
        <Space wrap>
          {isAdmin && (
            <>
              <Button type="link" size="small" icon={<ExperimentOutlined />} onClick={() => openProduction(r)}>
                Production
              </Button>
              <Button type="link" size="small" icon={<ToolOutlined />} onClick={() => openAdjust(r)}>
                Adjust
              </Button>
              <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
              <Popconfirm title="Delete?" onConfirm={() => deleteMutation.mutate(r.publicId)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const movementColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (d: string) => dayjs(d).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Item',
      dataIndex: 'itemId',
      render: (item: InventoryMovement['itemId']) => (typeof item === 'object' ? item.name : '—'),
    },
    {
      title: 'Movement Type',
      dataIndex: 'movementType',
      render: (t: string) => <Tag color={MOVEMENT_TYPE_COLORS[t]}>{MOVEMENT_TYPE_LABELS[t] || t}</Tag>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      render: (q: number) => (
        <Typography.Text type={q > 0 ? 'success' : q < 0 ? 'danger' : undefined}>
          {q > 0 ? `+${q}` : q}
        </Typography.Text>
      ),
    },
    { title: 'Before', dataIndex: 'beforeStock' },
    { title: 'After', dataIndex: 'afterStock' },
    { title: 'Ref No', dataIndex: 'referenceNo' },
    {
      title: 'User',
      dataIndex: 'userId',
      render: (u: InventoryMovement['userId']) => (typeof u === 'object' ? u.name : '—'),
    },
    { title: 'Remarks', dataIndex: 'remarks', ellipsis: true },
  ];

  const itemsTab = (
    <>
      <Space wrap className="mb-16">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
          className="w-280"
          allowClear
        />
        <Segmented
          value={stockFilter}
          onChange={(v) => {
            setStockFilter(v as 'all' | 'low');
            reset();
          }}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Low Stock', value: 'low' },
          ]}
        />
      </Space>

      <BaseTable
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
      />
    </>
  );

  const movementTab = (
    <>
      <Space wrap className="mb-16">
        <Select
          placeholder="Movement type"
          allowClear
          className="w-180"
          value={movementTypeFilter}
          onChange={(v) => {
            setMovementTypeFilter(v);
            resetMovement();
          }}
          options={Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <RangePicker
          value={dateRange}
          onChange={(v) => {
            setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null);
            resetMovement();
          }}
        />
      </Space>

      <BaseTable
        dataSource={movementsData?.data}
        columns={movementColumns}
        rowKey="_id"
        loading={movementsLoading}
        pagination={{
          current: movementPage,
          pageSize: movementLimit,
          total: movementsData?.pagination?.total,
          onChange: onMovementPageChange,
        }}
        scroll={{ x: 1100 }}
      />
    </>
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage stock, production, and movement history"
        refreshQueryKeys={['inventory', 'inventory-movements']}
        extra={
          isAdmin ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              Add Item
            </Button>
          ) : undefined
        }
      />

      <Tabs
        defaultActiveKey="items"
        items={[
          {
            key: 'items',
            label: (
              <span>
                <InboxOutlined /> Items
              </span>
            ),
            children: itemsTab,
          },
          {
            key: 'movements',
            label: (
              <span>
                <HistoryOutlined /> Movement Log
              </span>
            ),
            children: movementTab,
          },
        ]}
      />

      <BaseModal
        title={editing ? 'Edit Item' : 'Add Item'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.validateFields().then((v) => saveMutation.mutate(v))}
        confirmLoading={saveMutation.isPending}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU">
            <Input placeholder="Optional SKU" />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Input placeholder="e.g. pcs, liters, bottles" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Input placeholder="e.g. containers, chemicals" />
          </Form.Item>
          <Form.Item name="price" label="Price">
            <InputNumber min={0} prefix="₱" className="w-full" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
          {editing ? (
            <Form.Item label="Current Stock">
              <InputNumber value={editing.currentStock} disabled className="w-full" />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="initialQuantity"
                label="Initial Quantity"
                extra="Optional starting stock. Recorded as production on create."
              >
                <InputNumber min={0} placeholder="0" className="w-full" />
              </Form.Item>
              <Typography.Text type="secondary" className="mb-16">
                Leave at 0 to add stock later via Production.
              </Typography.Text>
            </>
          )}
          <Form.Item name="lowStockThreshold" label="Low Stock Threshold">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          {/* Refill type hidden — kept in schema for legacy slim/round inventory links
          <Form.Item name="refillType" label="Refill Type (internal)">
            <Select
              allowClear
              placeholder="Link to slim/round for delivery stock"
              options={[
                { label: 'Slim', value: 'slim' },
                { label: 'Round', value: 'round' },
              ]}
            />
          </Form.Item>
          */}
        </Form>
      </BaseModal>

      <BaseModal
        title={`Add Production — ${selectedItem?.name ?? ''}`}
        open={productionOpen}
        onCancel={() => setProductionOpen(false)}
        onOk={() => productionForm.validateFields().then((v) => productionMutation.mutate(v))}
        confirmLoading={productionMutation.isPending}
      >
        <Form form={productionForm} layout="vertical">
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks" rules={[{ required: true, message: 'Remarks are required' }]}>
            <Input.TextArea rows={3} placeholder="e.g. Morning production batch" />
          </Form.Item>
        </Form>
      </BaseModal>

      <BaseModal
        title={`Manual Adjustment — ${selectedItem?.name ?? ''}`}
        open={adjustOpen}
        onCancel={() => setAdjustOpen(false)}
        onOk={() => adjustForm.validateFields().then((v) => adjustMutation.mutate(v))}
        confirmLoading={adjustMutation.isPending}
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="quantity"
            label="Quantity (+ increase / − decrease)"
            rules={[{ required: true, type: 'number' }]}
          >
            <InputNumber className="w-full" placeholder="e.g. -5 or 10" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Reason is required' }]}>
            <Input.TextArea rows={3} placeholder="Required reason for this adjustment" />
          </Form.Item>
        </Form>
      </BaseModal>
    </div>
  );
};
