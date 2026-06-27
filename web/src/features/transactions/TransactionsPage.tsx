import { useState } from 'react';
import { Button, Select, Tag, Space, DatePicker, message, Popconfirm, Input } from 'antd';
import { PrinterOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { transactionApi } from '@/services/api';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { PageHeader } from '@/components/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { formatCurrency, formatDateTime, getStatusColor } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterTransactionChange } from '@/utils/invalidateBusinessQueries';
import { TRANSACTION_TYPES } from '@/utils/constants';
import type { Transaction } from '@/types';

export const TransactionsPage = () => {
  const queryClient = useQueryClient();
  const { companyName } = useCompanySettings();
  const { page, limit, onPageChange } = usePagination();
  const { search, setSearch, debouncedSearch } = useSearchFromUrl();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, limit, debouncedSearch, typeFilter, statusFilter, dateRange],
    queryFn: () =>
      transactionApi
        .list({
          page,
          limit,
          search: debouncedSearch || undefined,
          type: typeFilter,
          status: statusFilter,
          startDate: dateRange?.[0]?.toISOString(),
          endDate: dateRange?.[1]?.toISOString(),
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      message.success('Transaction deleted');
      invalidateAfterTransactionChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete transaction')),
  });

  const handlePrint = (record: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt ${record.invoiceNo}</title></head><body>
      <h2>${companyName}</h2>
      <p>Invoice: ${record.invoiceNo}</p>
      <p>Date: ${formatDateTime(record.createdAt)}</p>
      <p>Customer: ${record.customerName || 'Walk-in'}</p>
      <hr/>
      ${record.items.map((i) => `<p>${i.name} x${i.quantity} - ${formatCurrency(i.price * i.quantity)}</p>`).join('')}
      <hr/>
      <p><strong>Total: ${formatCurrency(record.amount)}</strong></p>
      <p>Payment: ${record.paymentMethod.toUpperCase()}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    { title: 'Date/Time', dataIndex: 'createdAt', render: (d: string) => formatDateTime(d) },
    { title: 'Invoice', dataIndex: 'invoiceNo' },
    { title: 'Type', dataIndex: 'type', render: (t: string) => <Tag>{t.toUpperCase()}</Tag> },
    {
      title: 'Customer',
      render: (_: unknown, r: Transaction) =>
        typeof r.customerId === 'object' ? r.customerId?.fullName : r.customerName || 'Walk-in',
    },
    { title: 'Amount', dataIndex: 'amount', render: (a: number) => formatCurrency(a) },
    { title: 'Payment', dataIndex: 'paymentMethod', render: (p: string) => p.toUpperCase() },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={getStatusColor(s)}>{s.toUpperCase()}</Tag> },
    {
      title: 'Actions',
      render: (_: unknown, r: Transaction) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => setViewTransaction(r)} />
          <Button type="text" icon={<PrinterOutlined />} onClick={() => handlePrint(r)} />
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
        title="Transactions"
        subtitle="View and manage all transactions"
        refreshQueryKeys={['transactions']}
      />

      <Space className="mb-16 filter-toolbar" wrap>
        <Input
          placeholder="Search invoice or customer..."
          prefix={<SearchOutlined />}
          allowClear
          className="w-280"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select placeholder="Type" allowClear className="w-140" value={typeFilter} onChange={setTypeFilter} options={TRANSACTION_TYPES} />
        <Select
          placeholder="Status"
          allowClear
          className="w-140"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
            { label: 'Cancelled', value: 'cancelled' },
          ]}
        />
        <DatePicker.RangePicker value={dateRange} onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
      </Space>

      <BaseTable
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
      />

      <BaseModal
        title={`Transaction ${viewTransaction?.invoiceNo}`}
        open={!!viewTransaction}
        onCancel={() => setViewTransaction(null)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => viewTransaction && handlePrint(viewTransaction)}>
            Print
          </Button>,
          <Button key="close" onClick={() => setViewTransaction(null)}>
            Close
          </Button>,
        ]}
      >
        {viewTransaction && (
          <div>
            <p><strong>Date:</strong> {formatDateTime(viewTransaction.createdAt)}</p>
            <p><strong>Type:</strong> {viewTransaction.type}</p>
            <p><strong>Payment:</strong> {viewTransaction.paymentMethod}</p>
            <p><strong>Amount:</strong> {formatCurrency(viewTransaction.amount)}</p>
            <p><strong>Items:</strong></p>
            <ul>
              {viewTransaction.items.map((item, i) => (
                <li key={i}>{item.name} x{item.quantity} — {formatCurrency(item.price * item.quantity)}</li>
              ))}
            </ul>
          </div>
        )}
      </BaseModal>
    </div>
  );
};
