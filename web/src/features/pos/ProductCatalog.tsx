import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  InputNumber,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, inventoryApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { InventoryItemFormModal } from '@/components/InventoryItemFormModal';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { getProductStockLabel } from '@/utils/productStock';
import type { InventoryItem, Product } from '@/types';

const { Text } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  refill: 'blue',
  container: 'purple',
  rental: 'gold',
  other: 'default',
};

type ConfirmFormValues = {
  price: number;
  status: Product['status'];
};

export const ProductCatalog = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange } = usePagination();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inlineAddOpen, setInlineAddOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | undefined>();
  const [pickedInventory, setPickedInventory] = useState<InventoryItem | null>(null);
  const [confirmForm] = Form.useForm<ConfirmFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, limit],
    queryFn: () => productApi.list({ page, limit, sortBy: 'name', sortOrder: 'asc' }).then((r) => r.data),
  });

  const {
    data: availableInventory,
    isLoading: inventoryLoading,
    isError: inventoryError,
    error: inventoryQueryError,
  } = useQuery({
    queryKey: ['inventory', 'not-in-catalog'],
    queryFn: () =>
      inventoryApi
        .list({ page: 1, limit: 200, notInCatalog: 'true', catalogStatus: 'none' })
        .then((r) => r.data.data),
    enabled: pickerOpen,
  });

  const inventoryOptions = useMemo(
    () =>
      (availableInventory ?? []).map((item: InventoryItem) => ({
        label: `${item.name} (${item.category}${item.unit ? ` · ${item.unit}` : ''})`,
        value: String(item._id),
      })),
    [availableInventory],
  );

  const selectedInventory = useMemo(() => {
    if (pickedInventory) return pickedInventory;
    return (availableInventory ?? []).find((i: InventoryItem) => String(i._id) === selectedInventoryId);
  }, [availableInventory, selectedInventoryId, pickedInventory]);

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products', 'active'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory', 'not-in-catalog'] });
  };

  const createMutation = useMutation({
    mutationFn: (values: ConfirmFormValues & { inventoryId: string; inventory: InventoryItem }) =>
      productApi.create({
        name: values.inventory.name,
        price: values.price,
        status: values.status,
        linkedInventoryId: values.inventoryId,
        category: 'refill',
        decrementsStock: true,
      }),
    onSuccess: () => {
      message.success('Product added to catalog');
      invalidateProducts();
      setConfirmOpen(false);
      setPickerOpen(false);
      setSelectedInventoryId(undefined);
      setPickedInventory(null);
      confirmForm.resetFields();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to add product')),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ConfirmFormValues) =>
      productApi.update(editing!._id, { price: values.price, status: values.status }),
    onSuccess: () => {
      message.success('Product updated');
      invalidateProducts();
      setConfirmOpen(false);
      setEditing(null);
      confirmForm.resetFields();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to update product')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      message.success('Product removed');
      invalidateProducts();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete product')),
  });

  const openAddFlow = () => {
    setEditing(null);
    setSelectedInventoryId(undefined);
    setPickedInventory(null);
    setPickerOpen(true);
  };

  const openEditConfirm = (record: Product) => {
    setEditing(record);
    confirmForm.setFieldsValue({ price: record.price, status: record.status });
    setConfirmOpen(true);
  };

  const handlePickerNext = () => {
    if (!selectedInventoryId || !selectedInventory) {
      message.warning('Select an inventory item');
      return;
    }
    confirmForm.setFieldsValue({
      price: selectedInventory.price ?? 0,
      status: 'active',
    });
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    confirmForm.validateFields().then((values) => {
      if (editing) {
        updateMutation.mutate(values);
      } else if (selectedInventoryId && selectedInventory) {
        createMutation.mutate({
          ...values,
          inventoryId: selectedInventoryId,
          inventory: selectedInventory,
        });
      }
    });
  };

  const handleInlineAddSuccess = (_item: InventoryItem) => {
    message.success('Item and catalog entry created');
    invalidateProducts();
    setInlineAddOpen(false);
    setPickerOpen(false);
    setSelectedInventoryId(undefined);
    setPickedInventory(null);
  };

  const columns = [
    { title: 'Product Name', dataIndex: 'name', ellipsis: true },
    {
      title: 'Retail (A)',
      dataIndex: 'price',
      render: (price: number, record: Product) => (
        <Space direction="vertical" size={0}>
          <span>{formatCurrency(price)}</span>
          {(record.tierBPrice != null || record.tierCPrice != null) && (
            <Text type="secondary" className="text-xs">
              {record.tierBPrice != null && `B: ${formatCurrency(record.tierBPrice)}`}
              {record.tierBPrice != null && record.tierCPrice != null && ' · '}
              {record.tierCPrice != null && `C: ${formatCurrency(record.tierCPrice)}`}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (c: string) => <Tag color={CATEGORY_COLORS[c]}>{c.toUpperCase()}</Tag>,
    },
    {
      title: 'Stock Source',
      key: 'stockSource',
      render: (_: unknown, record: Product) => {
        const label = getProductStockLabel(record);
        return label ? <Tag color="blue">{label}</Tag> : '—';
      },
    },
    {
      title: 'Affects Stock',
      dataIndex: 'decrementsStock',
      render: (v: boolean) => (
        <Tag color={v ? 'orange' : 'default'}>{v ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={getStatusColor(s)}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      width: 120,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditConfirm(record)} aria-label="Edit product" />
          <Popconfirm
            title="Remove this product?"
            description="It will no longer appear on Walk-In. Past sales are kept."
            onConfirm={() => deleteMutation.mutate(record._id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete product" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="mb-16"
        message="Product catalog"
        description="Add catalog entries from inventory items. Set retail price and active/disabled status here; full pricing and stock settings are managed in Inventory."
      />

      <BaseTable
        cardTitle="Products"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddFlow}>
            Add to Catalog
          </Button>
        }
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
      />

      <BaseModal
        title="Add to Catalog — Select Item"
        open={pickerOpen}
        onCancel={() => {
          setPickerOpen(false);
          setSelectedInventoryId(undefined);
          setPickedInventory(null);
        }}
        onOk={handlePickerNext}
        okText="Next"
        okButtonProps={{ disabled: !selectedInventoryId }}
        width={480}
      >
        {inventoryError ? (
          <Alert
            type="error"
            showIcon
            className="mb-16"
            message="Could not load inventory items"
            description={getApiErrorMessage(inventoryQueryError, 'Failed to load inventory')}
          />
        ) : null}

        {!inventoryLoading && !inventoryError && inventoryOptions.length === 0 ? (
          <Alert
            type="info"
            showIcon
            className="mb-16"
            message="All inventory items are already in the catalog"
            description="Use Add to create a new inventory item, then add it to the catalog."
          />
        ) : null}

        <Form layout="vertical">
          <Form.Item label="Inventory item" required>
            <Space.Compact className="w-full">
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select inventory item"
                value={selectedInventoryId}
                onChange={(id) => {
                  setSelectedInventoryId(id);
                  setPickedInventory(
                    (availableInventory ?? []).find((i: InventoryItem) => String(i._id) === id) ?? null,
                  );
                }}
                options={inventoryOptions}
                loading={inventoryLoading}
                notFoundContent={
                  inventoryLoading
                    ? 'Loading…'
                    : 'No items available — use Add to create one'
                }
                style={{ width: 'calc(100% - 88px)' }}
              />
              <Button icon={<PlusOutlined />} onClick={() => setInlineAddOpen(true)}>
                Add
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </BaseModal>

      <BaseModal
        title={editing ? 'Edit Catalog Entry' : 'Confirm Catalog Entry'}
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          if (!editing) return;
          setEditing(null);
        }}
        onOk={handleConfirm}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={400}
      >
        <Form form={confirmForm} layout="vertical">
          {!editing && selectedInventory ? (
            <Alert
              type="info"
              showIcon
              className="mb-16"
              message={selectedInventory.name}
              description={`${selectedInventory.category}${selectedInventory.unit ? ` · ${selectedInventory.unit}` : ''}`}
            />
          ) : null}
          <Form.Item
            name="price"
            label="Retail price"
            rules={[{ required: true, type: 'number', min: 0, message: 'Enter a retail price' }]}
          >
            <InputNumber min={0} precision={2} prefix="₱" className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Active — visible on Walk-In', value: 'active' },
                { label: 'Disabled — hidden from Walk-In', value: 'disabled' },
              ]}
            />
          </Form.Item>
          {editing ? (
            <Text type="secondary" className="text-sm">
              For category, wholesale/special pricing, and stock settings, edit the item in Inventory.
            </Text>
          ) : null}
        </Form>
      </BaseModal>

      <InventoryItemFormModal
        open={inlineAddOpen}
        onClose={() => setInlineAddOpen(false)}
        onSuccess={handleInlineAddSuccess}
      />
    </div>
  );
};
