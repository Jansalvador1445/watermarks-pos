import { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Form, Select, InputNumber, Input, Table, Tag, message, Space, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gallonApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { BaseModal } from '@/components/BaseModal';
import { formatDateTime } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import type { TrackedContainerItem } from '@/types';

type RecordMode = 'out' | 'return' | null;

const NEW_ITEM_VALUE = '__new__';

export const ItemTrackingPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [recordMode, setRecordMode] = useState<RecordMode>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | undefined>();
  const [form] = Form.useForm();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['gallons-overview'],
    queryFn: () => gallonApi.overview().then((r) => r.data.data),
  });

  const { data: history } = useQuery({
    queryKey: ['gallons-history'],
    queryFn: () => gallonApi.history().then((r) => r.data.data),
  });

  const trackedItems: TrackedContainerItem[] = useMemo(() => {
    if (overview?.items?.length) return overview.items;
    const legacy: TrackedContainerItem[] = [];
    if (overview?.slim) legacy.push(overview.slim);
    if (overview?.round) legacy.push(overview.round);
    return legacy;
  }, [overview]);

  const itemOptions = useMemo(
    () => [
      ...trackedItems.map((item) => ({ label: item.label, value: item.itemKey })),
      { label: '+ Add new container type', value: NEW_ITEM_VALUE },
    ],
    [trackedItems],
  );

  const invalidateGallons = () => {
    queryClient.invalidateQueries({ queryKey: ['gallons-overview'] });
    queryClient.invalidateQueries({ queryKey: ['gallons-history'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const recordOutMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => gallonApi.recordOut(values),
    onSuccess: () => {
      message.success('Containers recorded out');
      invalidateGallons();
      closeModal();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to record out')),
  });

  const recordReturnMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => gallonApi.recordReturn(values),
    onSuccess: () => {
      message.success('Containers recorded as returned');
      invalidateGallons();
      closeModal();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to record return')),
  });

  const openModal = (mode: 'out' | 'return') => {
    setRecordMode(mode);
    setSelectedItemKey(undefined);
    form.resetFields();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setRecordMode(null);
    setSelectedItemKey(undefined);
    form.resetFields();
  };

  const buildPayload = (values: Record<string, unknown>) => {
    const selection = values.itemSelection as string;
    const payload: Record<string, unknown> = {
      quantity: values.quantity,
      remarks: values.remarks,
    };

    if (selection === NEW_ITEM_VALUE) {
      payload.label = values.newItemLabel;
    } else {
      payload.itemKey = selection;
    }

    return payload;
  };

  const handleSubmit = (values: Record<string, unknown>) => {
    const payload = buildPayload(values);
    if (recordMode === 'out') recordOutMutation.mutate(payload);
    else if (recordMode === 'return') recordReturnMutation.mutate(payload);
  };

  const historyColumns = [
    { title: 'Date', dataIndex: 'date', render: (d: string) => formatDateTime(d) },
    {
      title: 'Container',
      dataIndex: 'label',
      render: (label: string, row: { itemKey?: string }) => label || row.itemKey?.toUpperCase(),
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      render: (d: string) => (
        <Tag color={d === 'return' ? 'green' : 'orange'}>{d === 'return' ? 'RETURN' : 'OUT'}</Tag>
      ),
    },
    { title: 'Quantity', dataIndex: 'quantity' },
    { title: 'Remarks', dataIndex: 'remarks', ellipsis: true },
  ];

  const isPending = recordOutMutation.isPending || recordReturnMutation.isPending;
  const isNewItem = selectedItemKey === NEW_ITEM_VALUE;

  return (
    <div>
      <PageHeader
        title="Item Tracking"
        subtitle="Track any container type (bottles, jugs, slim, round, etc.) — out and return flow."
        refreshQueryKeys={[{ prefix: 'gallons-' }]}
        extra={
          <Space>
            <Button type="primary" icon={<ArrowUpOutlined />} onClick={() => openModal('out')}>
              Record Out
            </Button>
            <Button icon={<ArrowDownOutlined />} onClick={() => openModal('return')}>
              Record Return
            </Button>
          </Space>
        }
      />

      {trackedItems.length === 0 && !isLoading ? (
        <Card bordered={false} className="card-rounded">
          <Empty description="No tracked containers yet. Record an out transaction to add a container type." />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {trackedItems.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.itemKey}>
              <Card title={item.label} bordered={false} className="card-rounded" loading={isLoading}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Out" value={item.currentOut} valueStyle={{ color: '#fa8c16' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Returned" value={item.returned} valueStyle={{ color: '#52c41a' }} />
                  </Col>
                </Row>
                <div className="highlight-box">
                  <strong>Currently Out:</strong> {item.currentOut}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card title="History" bordered={false} className="card-rounded mt-24">
        <Table dataSource={history} columns={historyColumns} rowKey="_id" pagination={{ pageSize: 10 }} />
      </Card>

      <BaseModal
        title={recordMode === 'out' ? 'Record Out' : 'Record Return'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.validateFields().then((v) => handleSubmit(v))}
        confirmLoading={isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="itemSelection"
            label="Container Type"
            rules={[{ required: true, message: 'Select or add a container type' }]}
            extra="Choose an existing type or add a new one (e.g. PET Bottle, 1L Jug, Slim, Round)"
          >
            <Select
              showSearch
              placeholder="Select container"
              options={itemOptions}
              optionFilterProp="label"
              onChange={(value) => setSelectedItemKey(value)}
            />
          </Form.Item>

          {isNewItem && (
            <Form.Item
              name="newItemLabel"
              label="New Container Name"
              rules={[{ required: true, message: 'Enter a name for this container type' }]}
            >
              <Input prefix={<PlusOutlined />} placeholder="e.g. PET Bottle, 1 Gallon Jug" />
            </Form.Item>
          )}

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' },
            ]}
          >
            <InputNumber min={1} placeholder="e.g. 10" className="w-full" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Optional remarks" />
          </Form.Item>
        </Form>
      </BaseModal>
    </div>
  );
};
