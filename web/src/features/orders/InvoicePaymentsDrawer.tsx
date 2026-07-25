import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { paymentApi } from '@/services/api';
import { PAYMENT_METHODS } from '@/utils/constants';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterInvoiceChange } from '@/utils/invalidateBusinessQueries';
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '@/features/reports/reporting';
import type { Invoice, InvoicePaymentStatus } from '@/types';

const { Text } = Typography;

interface InvoicePaymentsDrawerProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export const InvoicePaymentsDrawer = ({ invoice, open, onClose }: InvoicePaymentsDrawerProps) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice-payments', invoice?._id],
    queryFn: () => paymentApi.listByInvoice(invoice!._id).then((r) => r.data.data),
    enabled: open && !!invoice?._id && invoice.status !== 'rejected',
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      paymentApi.create({
        invoiceId: invoice!._id,
        amount: Number(values.amount),
        paymentMethod: String(values.paymentMethod),
        paymentDate: values.paymentDate
          ? dayjs(values.paymentDate as dayjs.Dayjs).toISOString()
          : undefined,
        notes: values.notes as string | undefined,
      }),
    onSuccess: () => {
      message.success('Payment recorded');
      form.resetFields();
      invalidateAfterInvoiceChange(queryClient);
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoice?._id] });
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to record payment')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentApi.delete(id),
    onSuccess: () => {
      message.success('Payment deleted');
      invalidateAfterInvoiceChange(queryClient);
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoice?._id] });
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete payment')),
  });

  const summary = data?.summary;
  const paymentStatus = summary?.paymentStatus as InvoicePaymentStatus | undefined;

  return (
    <Drawer
      title={invoice ? `Payments — ${invoice.invoiceNo}` : 'Payments'}
      open={open}
      onClose={onClose}
      width={560}
      destroyOnClose
    >
      {invoice && (
        <>
          <Space direction="vertical" className="mb-16">
            <Text>Invoice total: {formatCurrency(invoice.total)}</Text>
            <Text>Paid: {formatCurrency(summary?.totalPaid ?? 0)}</Text>
            <Text strong>Balance: {formatCurrency(summary?.outstandingBalance ?? invoice.total)}</Text>
            {paymentStatus && (
              <Tag color={PAYMENT_STATUS_COLORS[paymentStatus]}>{PAYMENT_STATUS_LABELS[paymentStatus]}</Tag>
            )}
          </Space>

          <Table
            loading={isLoading}
            dataSource={data?.payments ?? []}
            rowKey="_id"
            pagination={false}
            size="small"
            className="mb-16"
            columns={[
              {
                title: 'Date',
                dataIndex: 'paymentDate',
                render: (d: string) => formatDateTime(d),
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                render: (v: number) => formatCurrency(v),
              },
              {
                title: 'Method',
                dataIndex: 'paymentMethod',
                render: (v: string) => v.toUpperCase(),
              },
              {
                title: '',
                render: (_: unknown, record: { _id: string }) => (
                  <Popconfirm title="Delete payment?" onConfirm={() => deleteMutation.mutate(record._id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                ),
              },
            ]}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createMutation.mutate(values)}
            initialValues={{ paymentMethod: 'cash', paymentDate: dayjs() }}
          >
            <Form.Item name="amount" label="Amount" rules={[{ required: true, type: 'number', min: 0.01 }]}>
              <InputNumber min={0.01} prefix="₱" className="w-full" />
            </Form.Item>
            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Select options={PAYMENT_METHODS} />
            </Form.Item>
            <Form.Item name="paymentDate" label="Payment Date">
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} icon={<DollarOutlined />}>
              Record Payment
            </Button>
          </Form>
        </>
      )}
    </Drawer>
  );
};
