import { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, inventoryApi, pricingTierApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseDrawer } from '@/components/BaseDrawer';
import { ProductPricingFields } from '@/components/ProductPricingFields';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { getProductStockLabel } from '@/utils/productStock';
import type { InventoryItem, Product } from '@/types';

const CATEGORY_OPTIONS = [
  { label: 'Refill', value: 'refill' },
  { label: 'Container', value: 'container' },
  { label: 'Rental', value: 'rental' },
  { label: 'Other', value: 'other' },
];

const CATEGORY_COLORS: Record<string, string> = {
  refill: 'blue',
  container: 'purple',
  rental: 'gold',
  other: 'default',
};

type ProductFormValues = {
  name: string;
  price: number;
  purchasePrice?: number;
  tierBPrice?: number;
  tierCPrice?: number;
  category: Product['category'];
  linkedInventoryId?: string;
  decrementsStock: boolean;
  status: Product['status'];
};

const defaultFormValues: ProductFormValues = {
  name: '',
  price: 0,
  purchasePrice: undefined,
  tierBPrice: undefined,
  tierCPrice: undefined,
  category: 'refill',
  linkedInventoryId: undefined,
  decrementsStock: true,
  status: 'active',
};

export const ProductCatalog = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange } = usePagination();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm<ProductFormValues>();
  const decrementsStock = Form.useWatch('decrementsStock', form);
  const category = Form.useWatch('category', form);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, limit],
    queryFn: () => productApi.list({ page, limit, sortBy: 'name', sortOrder: 'asc' }).then((r) => r.data),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'for-product-link'],
    queryFn: () => inventoryApi.list({ page: 1, limit: 200 }).then((r) => r.data.data),
  });

  const { data: pricingTiers } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => pricingTierApi.list().then((r) => r.data.data),
  });

  const inventoryOptions =
    inventoryData?.map((item: InventoryItem) => ({
      label: `${item.name} (${item.category}${item.unit ? ` · ${item.unit}` : ''})`,
      value: item._id,
    })) ?? [];

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products', 'active'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload = {
        ...values,
        linkedInventoryId: values.decrementsStock ? values.linkedInventoryId : undefined,
        purchasePrice: values.purchasePrice ?? undefined,
        tierBPrice: values.tierBPrice ?? undefined,
        tierCPrice: values.tierCPrice ?? undefined,
      };
      return editing ? productApi.update(editing._id, payload) : productApi.create(payload);
    },
    onSuccess: () => {
      message.success(editing ? 'Product updated' : 'Product created');
      invalidateProducts();
      setDrawerOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to save product')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      message.success('Product removed');
      invalidateProducts();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete product')),
  });

  const openDrawer = (record?: Product) => {
    setEditing(record ?? null);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        price: record.price,
        purchasePrice: record.purchasePrice,
        tierBPrice: record.tierBPrice,
        tierCPrice: record.tierCPrice,
        category: record.category,
        linkedInventoryId: record.linkedInventoryId,
        decrementsStock: record.decrementsStock,
        status: record.status,
      });
    } else {
      form.setFieldsValue(defaultFormValues);
    }
    setDrawerOpen(true);
  };

  const handleCategoryChange = (value: Product['category']) => {
    if (value === 'refill') {
      form.setFieldsValue({ decrementsStock: true, category: value });
    } else if (value === 'rental' || value === 'container') {
      form.setFieldsValue({ decrementsStock: false, linkedInventoryId: undefined, category: value });
    } else {
      form.setFieldsValue({ category: value });
    }
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
            <Typography.Text type="secondary" className="text-xs">
              {record.tierBPrice != null && `B: ${formatCurrency(record.tierBPrice)}`}
              {record.tierBPrice != null && record.tierCPrice != null && ' · '}
              {record.tierCPrice != null && `C: ${formatCurrency(record.tierCPrice)}`}
            </Typography.Text>
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
          <Button type="text" icon={<EditOutlined />} onClick={() => openDrawer(record)} aria-label="Edit product" />
          <Popconfirm
            title="Remove this product?"
            description="It will no longer appear on the POS. Past sales are kept."
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
        message="Product catalog & pricing"
        description="Add products here and set retail, wholesale, and special prices per item. Walk-in POS sales use the retail price. Link refill products to an inventory item for stock tracking."
      />

      <BaseTable
        cardTitle="Products"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
            Add Product
          </Button>
        }
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
      />

      <BaseDrawer
        title={editing ? 'Edit Product' : 'Add Product'}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        extra={
          <Button
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => form.validateFields().then((v) => saveMutation.mutate(v))}
          >
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" initialValues={defaultFormValues}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, min: 2, message: 'Enter a product name (min 2 characters)' }]}
            extra="e.g. Slim Refill, Round Refill, PET Bottle Refill, 1L Jug Refill"
          >
            <Input placeholder="e.g. PET Bottle Refill" maxLength={120} />
          </Form.Item>

          <ProductPricingFields tiers={pricingTiers} />

          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS} onChange={handleCategoryChange} />
          </Form.Item>

          <Form.Item
            name="decrementsStock"
            label="Decrease filled water stock on sale"
            valuePropName="checked"
            extra={
              category === 'refill'
                ? 'Refill products decrease inventory when sold.'
                : 'Containers and rentals usually do not affect filled water stock.'
            }
          >
            <Switch />
          </Form.Item>

          {decrementsStock ? (
            <Form.Item
              name="linkedInventoryId"
              label="Inventory Item (stock source)"
              rules={[{ required: true, message: 'Select which inventory item this product draws from' }]}
              extra="Link to any inventory item — slim, round, PET bottle, jug, etc."
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select inventory item"
                options={inventoryOptions}
                loading={!inventoryData}
              />
            </Form.Item>
          ) : null}

          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Active — visible on POS', value: 'active' },
                { label: 'Disabled — hidden from POS', value: 'disabled' },
              ]}
            />
          </Form.Item>

          <Typography.Text type="secondary" className="text-sm">
            Disabled products are hidden from the sale screen but kept for transaction history.
          </Typography.Text>
        </Form>
      </BaseDrawer>
    </div>
  );
};
