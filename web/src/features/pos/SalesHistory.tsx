import { useState } from 'react';
import { Button, DatePicker, Space, Tag, Typography, Empty, Select } from 'antd';
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { transactionApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { usePagination } from '@/hooks/usePagination';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatCurrency, formatDateTime, getStatusColor } from '@/utils/formatters';
import type { Transaction } from '@/types';

const { Text } = Typography;

const SALE_TYPE_LABELS: Record<string, string> = {
  pos: 'POS Sale',
  walkin: 'Walk-in Sale',
};

const formatPayment = (method: string) => {
  const map: Record<string, string> = {
    cash: 'Cash',
    gcash: 'GCash',
    bank: 'Bank Transfer',
  };
  return map[method] || method.toUpperCase();
};

const stockImpactSummary = (items: Transaction['items']) => {
  const stockItems = items.filter((i) => i.decrementsStock && i.gallonType);
  if (stockItems.length === 0) return 'No filled water stock change';
  return stockItems
    .map((i) => `${i.name} −${i.quantity} (${i.gallonType})`)
    .join(', ');
};

const printReceipt = (record: Transaction, companyName: string) => {
  const customer =
    typeof record.customerId === 'object' ? record.customerId?.fullName : record.customerName || 'Walk-in';
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const discountLine =
    record.discount > 0
      ? `<p>Discount: ${formatCurrency(record.discount)}</p>`
      : '';

  printWindow.document.write(`
    <html><head><title>Receipt ${record.invoiceNo}</title></head><body>
    <h2>${companyName}</h2>
    <p>Invoice: ${record.invoiceNo}</p>
    <p>Type: ${SALE_TYPE_LABELS[record.type] || record.type}</p>
    <p>Date: ${formatDateTime(record.createdAt)}</p>
    <p>Customer: ${customer}</p>
    <hr/>
    ${record.items.map((i) => `<p>${i.name} x${i.quantity} - ${formatCurrency(i.price * i.quantity)}</p>`).join('')}
    <hr/>
    ${discountLine}
    <p><strong>Total: ${formatCurrency(record.amount)}</strong></p>
    <p>Payment: ${formatPayment(record.paymentMethod)}</p>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

export const SalesHistory = () => {
  const { companyName } = useCompanySettings();
  const { page, limit, onPageChange } = usePagination(1, 10);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pos-sales', page, limit, dateRange, typeFilter],
    queryFn: () =>
      transactionApi
        .list({
          page,
          limit,
          types: typeFilter || 'pos,walkin',
          startDate: dateRange?.[0]?.startOf('day').toISOString(),
          endDate: dateRange?.[1]?.endOf('day').toISOString(),
        })
        .then((r) => r.data),
  });

  const sales = data?.data ?? [];
  const totalSales = sales.reduce((sum, tx) => sum + tx.amount, 0);

  const columns = [
    { title: 'Date/Time', dataIndex: 'createdAt', render: (d: string) => formatDateTime(d) },
    { title: 'Invoice', dataIndex: 'invoiceNo' },
    {
      title: 'Sale Type',
      dataIndex: 'type',
      render: (t: string) => <Tag color={t === 'walkin' ? 'cyan' : 'purple'}>{SALE_TYPE_LABELS[t] || t}</Tag>,
    },
    {
      title: 'Customer',
      render: (_: unknown, r: Transaction) =>
        typeof r.customerId === 'object' ? r.customerId?.fullName : r.customerName || 'Walk-in',
    },
    {
      title: 'Items',
      render: (_: unknown, r: Transaction) => (
        <Text type="secondary" className="pos-sales-history__items">
          {r.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (a: number, r: Transaction) => (
        <span>
          {formatCurrency(a)}
          {r.discount > 0 ? (
            <Text type="secondary" className="text-sm">
              {' '}
              (−{formatCurrency(r.discount)})
            </Text>
          ) : null}
        </span>
      ),
    },
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
    {
      title: 'Actions',
      width: 96,
      render: (_: unknown, r: Transaction) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EyeOutlined />} aria-label="View sale" onClick={() => setViewTransaction(r)} />
          <Button type="text" size="small" icon={<PrinterOutlined />} aria-label="Print receipt" onClick={() => printReceipt(r, companyName)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="pos-sales-history">
      <BaseTable
        extra={
          <Space wrap>
            <Select
              placeholder="All sale types"
              allowClear
              className="w-160"
              value={typeFilter}
              onChange={(v) => {
                onPageChange(1, limit);
                setTypeFilter(v);
              }}
              options={[
                { label: 'POS Sale', value: 'pos' },
                { label: 'Walk-in Sale', value: 'walkin' },
              ]}
            />
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(v) => {
                onPageChange(1, limit);
                setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null);
              }}
              allowClear
            />
            {sales.length > 0 && (
              <Text type="secondary">
                Page total: <Text strong>{formatCurrency(totalSales)}</Text>
              </Text>
            )}
          </Space>
        }
        dataSource={sales}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No counter sales yet. Complete a sale on the New Sale tab."
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.pagination?.total,
          onChange: onPageChange,
        }}
      />

      <BaseModal
        title={`Sale ${viewTransaction?.invoiceNo}`}
        open={!!viewTransaction}
        onCancel={() => setViewTransaction(null)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => viewTransaction && printReceipt(viewTransaction, companyName)}>
            Print Receipt
          </Button>,
          <Button key="close" onClick={() => setViewTransaction(null)}>
            Close
          </Button>,
        ]}
      >
        {viewTransaction && (
          <div className="pos-sales-history__detail">
            <p>
              <strong>Date:</strong> {formatDateTime(viewTransaction.createdAt)}
            </p>
            <p>
              <strong>Sale Type:</strong> {SALE_TYPE_LABELS[viewTransaction.type] || viewTransaction.type}
            </p>
            <p>
              <strong>Customer:</strong>{' '}
              {typeof viewTransaction.customerId === 'object'
                ? viewTransaction.customerId?.fullName
                : viewTransaction.customerName || 'Walk-in'}
            </p>
            <p>
              <strong>Payment:</strong> {formatPayment(viewTransaction.paymentMethod)}
            </p>
            <p>
              <strong>Status:</strong> {viewTransaction.status}
            </p>
            {viewTransaction.discount > 0 && (
              <p>
                <strong>Discount:</strong> {formatCurrency(viewTransaction.discount)}
              </p>
            )}
            <p>
              <strong>Total:</strong> {formatCurrency(viewTransaction.amount)}
            </p>
            <p>
              <strong>Inventory impact:</strong> {stockImpactSummary(viewTransaction.items)}
            </p>
            <p>
              <strong>Items:</strong>
            </p>
            <ul>
              {viewTransaction.items.map((item, i) => (
                <li key={i}>
                  {item.name} x{item.quantity} — {formatCurrency(item.price * item.quantity)}
                  {item.decrementsStock && item.gallonType ? (
                    <Text type="secondary"> (decreases {item.gallonType} stock)</Text>
                  ) : (
                    <Text type="secondary"> (no stock change)</Text>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </BaseModal>
    </div>
  );
};
