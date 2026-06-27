import { useMemo, useState } from 'react';
import {
  Button,
  Tag,
  Space,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Popconfirm,
  Typography,
  Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, customerApi, productApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseDrawer } from '@/components/BaseDrawer';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { usePagination } from '@/hooks/usePagination';
import { PAYMENT_METHODS } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterInvoiceChange } from '@/utils/invalidateBusinessQueries';
import type { Customer, Invoice, Product } from '@/types';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  pending: 'gold',
  approved: 'blue',
  rejected: 'red',
  converted: 'green',
};

const calcLineSubtotal = (item: { quantity?: number; unitPrice?: number; discount?: number }) => {
  const qty = item.quantity ?? 0;
  const price = item.unitPrice ?? 0;
  const discount = item.discount ?? 0;
  return Math.max(0, qty * price - discount);
};

export const InvoicesPage = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange } = usePagination();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, limit, statusFilter],
    queryFn: () => invoiceApi.list({ page, limit, status: statusFilter }).then((r) => r.data),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all-for-invoices'],
    queryFn: () => customerApi.list({ page: 1, limit: 200 }).then((r) => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'active-for-invoices'],
    queryFn: () => productApi.active().then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      editing ? invoiceApi.update(editing._id, values) : invoiceApi.create(values),
    onSuccess: () => {
      message.success(editing ? 'Invoice updated' : 'Invoice created');
      invalidateAfterInvoiceChange(queryClient);
      setDrawerOpen(false);
      form.resetFields();
      setEditing(null);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to save invoice')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => {
      message.success('Invoice deleted');
      invalidateAfterInvoiceChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete invoice')),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.convert(id),
    onSuccess: () => {
      message.success('Invoice converted to delivery');
      invalidateAfterInvoiceChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to convert invoice')),
  });

  const customerOptions =
    customersData?.data?.map((c: Customer) => ({ label: c.fullName, value: c._id })) || [];

  const productOptions =
    productsData?.map((p: Product) => ({ label: `${p.name} — ${formatCurrency(p.price)}`, value: p._id, product: p })) ||
    [];

  const watchedItems = Form.useWatch('items', form) ?? [];
  const watchedTax = Form.useWatch('tax', form) ?? 0;

  const totals = useMemo(() => {
    const subtotal = watchedItems.reduce(
      (sum: number, item: { quantity?: number; unitPrice?: number; discount?: number }) =>
        sum + calcLineSubtotal(item),
      0,
    );
    const tax = Number(watchedTax) || 0;
    return { subtotal, tax, total: subtotal + tax };
  }, [watchedItems, watchedTax]);

  const handleProductSelect = (productId: string, fieldName: number) => {
    const product = productsData?.find((p: Product) => p._id === productId);
    if (!product) return;
    const items = form.getFieldValue('items') ?? [];
    items[fieldName] = {
      ...items[fieldName],
      productId,
      name: product.name,
      unitPrice: product.price,
      quantity: items[fieldName]?.quantity ?? 1,
      discount: items[fieldName]?.discount ?? 0,
    };
    form.setFieldsValue({ items });
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      paymentMethod: 'cash',
      tax: 0,
      items: [{ productId: undefined, name: '', quantity: 1, unitPrice: 0, discount: 0 }],
    });
    setDrawerOpen(true);
  };

  const openEdit = (record: Invoice) => {
    setEditing(record);
    form.setFieldsValue({
      customerId: typeof record.customerId === 'object' ? record.customerId._id : record.customerId,
      paymentMethod: record.paymentMethod,
      tax: record.tax,
      notes: record.notes,
      status: record.status,
      items: record.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
    });
    setDrawerOpen(true);
  };

  const columns = [
    { title: 'Invoice No', dataIndex: 'invoiceNo' },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, r: Invoice) =>
        typeof r.customerId === 'object' ? r.customerId.fullName : '—',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      render: (v: string) => v.toUpperCase(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      render: (_: unknown, r: Invoice) => (
        <Space>
          <PermissionGate permission="orders:*">
            {r.status !== 'converted' && (
              <>
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                {(r.status === 'pending' || r.status === 'approved') && (
                  <Popconfirm title="Convert to delivery?" onConfirm={() => convertMutation.mutate(r._id)}>
                    <Button type="text" icon={<SwapOutlined />} title="Convert to Delivery" />
                  </Popconfirm>
                )}
                <Popconfirm title="Delete invoice?" onConfirm={() => deleteMutation.mutate(r._id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            )}
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage customer orders with line items before delivery"
        refreshQueryKeys={['invoices', 'customers', 'products']}
        extra={
          <PermissionGate permission="orders:*">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Invoice
            </Button>
          </PermissionGate>
        }
      />

      <Space className="mb-16" wrap>
        <Select
          allowClear
          placeholder="Filter by status"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Converted', value: 'converted' },
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

      <BaseDrawer
        title={editing ? 'Edit Invoice' : 'New Invoice'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={640}
        extra={
          <Button type="primary" loading={saveMutation.isPending} onClick={() => form.submit()}>
            Save
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
          initialValues={{
            paymentMethod: 'cash',
            tax: 0,
            items: [{ quantity: 1, unitPrice: 0, discount: 0 }],
          }}
        >
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={customerOptions} placeholder="Select customer" />
          </Form.Item>

          <Divider plain>Line Items</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="start" wrap className="mb-12 w-full">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      label="Product"
                      rules={[{ required: true, message: 'Select product' }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Product"
                        style={{ width: 180 }}
                        options={productOptions}
                        onChange={(val) => handleProductSelect(val, name)}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'name']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label="Qty"
                      rules={[{ required: true, type: 'number', min: 1 }]}
                    >
                      <InputNumber min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unitPrice']}
                      label="Unit Price"
                      rules={[{ required: true, type: 'number', min: 0 }]}
                    >
                      <InputNumber min={0} prefix="₱" style={{ width: 110 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'discount']} label="Discount">
                      <InputNumber min={0} prefix="₱" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item label="Subtotal">
                      <Text>{formatCurrency(calcLineSubtotal(watchedItems[name] ?? {}))}</Text>
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="mt-28" />
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ quantity: 1, unitPrice: 0, discount: 0 })} block icon={<PlusOutlined />}>
                  Add Line Item
                </Button>
              </>
            )}
          </Form.List>

          <Divider plain>Totals</Divider>
          <Form.Item name="tax" label="Tax">
            <InputNumber min={0} prefix="₱" className="w-full" />
          </Form.Item>
          <div className="highlight-box mb-16">
            <Space direction="vertical" size={4}>
              <Text>Subtotal: {formatCurrency(totals.subtotal)}</Text>
              <Text>Tax: {formatCurrency(totals.tax)}</Text>
              <Text strong>Grand Total: {formatCurrency(totals.total)}</Text>
            </Space>
          </div>

          <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
            <Select options={PAYMENT_METHODS} />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </BaseDrawer>
    </div>
  );
};
