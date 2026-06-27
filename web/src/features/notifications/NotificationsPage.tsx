import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BellOutlined,
  CarOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { notificationApi, deliveryApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { formatRelativeTime, formatDate } from '@/utils/formatters';
import { useNotificationStore } from '@/store/notificationStore';
import { getNotificationTypeLabel } from '@/components/NotificationListener';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterDeliveryChange } from '@/utils/invalidateBusinessQueries';
import type { Notification } from '@/types';

const { Text, Title } = Typography;

type FilterKey = 'all' | 'unread' | 'action';

const typeColors: Record<string, string> = {
  overdue_delivery: 'orange',
  delivery_3day_late: 'red',
  delivery_continue_decision: 'volcano',
  low_inventory: 'red',
  backup_reminder: 'blue',
  payment_reminder: 'gold',
};

const typeIcons: Record<string, React.ReactNode> = {
  overdue_delivery: <CarOutlined />,
  delivery_3day_late: <ExclamationCircleOutlined />,
  delivery_continue_decision: <WarningOutlined />,
  low_inventory: <ExclamationCircleOutlined />,
  backup_reminder: <BellOutlined />,
  payment_reminder: <BellOutlined />,
};

const isActionRequired = (item: Notification) =>
  item.type === 'delivery_continue_decision' && !!item.metadata?.deliveryId;

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [continueModal, setContinueModal] = useState<{ deliveryId: string; customerName: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(dayjs());

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      notificationApi.list().then((r) => {
        setUnreadCount(r.data.data.unreadCount || 0);
        return r.data.data;
      }),
  });

  const items: Notification[] = data?.data ?? [];

  const stats = useMemo(() => {
    const unread = items.filter((n) => !n.isRead).length;
    const action = items.filter(isActionRequired).length;
    return { total: items.length, unread, action };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.isRead);
    if (filter === 'action') return items.filter(isActionRequired);
    return items;
  }, [items, filter]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to mark as read')),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      message.success('All notifications marked as read');
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to mark all as read')),
  });

  const decisionMutation = useMutation({
    mutationFn: ({ deliveryId, action, date }: { deliveryId: string; action: 'continue' | 'stop'; date?: string }) =>
      deliveryApi.decision(deliveryId, action, date),
    onSuccess: (_, vars) => {
      message.success(vars.action === 'continue' ? 'Delivery will continue' : 'Delivery stopped');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      invalidateAfterDeliveryChange(queryClient);
      setContinueModal(null);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Could not update delivery')),
  });

  const handleContinue = (item: Notification) => {
    const deliveryId = item.metadata?.deliveryId as string;
    const customerName = (item.metadata?.customerName as string) || 'Customer';
    if (!deliveryId) return;
    setRescheduleDate(dayjs());
    setContinueModal({ deliveryId, customerName });
    if (!item.isRead) markReadMutation.mutate(item._id);
  };

  const handleStop = (item: Notification) => {
    const deliveryId = item.metadata?.deliveryId as string;
    if (!deliveryId) return;
    Modal.confirm({
      title: 'Stop this delivery?',
      content: 'This delivery will be marked as stopped and removed from active follow-ups.',
      okText: 'Stop Delivery',
      okButtonProps: { danger: true },
      onOk: () => decisionMutation.mutateAsync({ deliveryId, action: 'stop' }),
    });
    if (!item.isRead) markReadMutation.mutate(item._id);
  };

  const emptyDescription =
    filter === 'unread'
      ? 'You have no unread notifications'
      : filter === 'action'
        ? 'No action items right now'
        : 'No notifications yet';

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications"
        subtitle="Delivery alerts, overdue reminders, and action items"
        refreshQueryKeys={['notifications']}
        extra={
          <Button
            onClick={() => markAllMutation.mutate()}
            disabled={!stats.unread}
            loading={markAllMutation.isPending}
          >
            Mark All Read
          </Button>
        }
      />

      <Row gutter={[16, 16]} className="notifications-summary">
        <Col xs={24} sm={8}>
          <Card bordered={false} className="card-rounded">
            <Statistic title="Unread" value={stats.unread} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="card-rounded">
            <Statistic title="Action Required" value={stats.action} valueStyle={{ color: '#fa541c' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="card-rounded">
            <Statistic title="Total" value={stats.total} />
          </Card>
        </Col>
      </Row>

      <div className="notifications-toolbar">
        <Segmented
          value={filter}
          onChange={(value) => setFilter(value as FilterKey)}
          options={[
            { label: `All (${stats.total})`, value: 'all' },
            { label: `Unread (${stats.unread})`, value: 'unread' },
            { label: `Action (${stats.action})`, value: 'action' },
          ]}
        />
        <p className="notifications-toolbar__hint">
          {filter === 'action'
            ? 'These need Continue or Stop before follow-up stops.'
            : 'Tap Mark read when you have handled an alert.'}
        </p>
      </div>

      <Spin spinning={isLoading}>
        {filteredItems.length === 0 ? (
          <Card bordered={false} className="card-rounded">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
          </Card>
        ) : (
          <div className="notifications-list">
            {filteredItems.map((item) => {
              const needsAction = isActionRequired(item);
              const cardClass = [
                'notification-card',
                'card-rounded',
                item.isRead ? 'notification-card--read' : 'notification-card--unread',
                needsAction ? 'notification-card--action' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <Card key={item._id} bordered={false} className={cardClass} size="small">
                  <div className="notification-card__head">
                    <div className="notification-card__title-row">
                      {!item.isRead && <Badge status="processing" />}
                      <Tag icon={typeIcons[item.type]} color={typeColors[item.type] || 'default'}>
                        {getNotificationTypeLabel(item.type)}
                      </Tag>
                      <Title level={5} className="notification-card__title">
                        {item.title}
                      </Title>
                    </div>
                    <span className="notification-card__time">{formatRelativeTime(item.createdAt)}</span>
                  </div>

                  <p className="notification-card__message">{item.message}</p>

                  {(item.metadata?.customerName || item.metadata?.scheduledDate) && (
                    <div className="notification-card__meta">
                      {item.metadata?.customerName && (
                        <Tag>{item.metadata.customerName as string}</Tag>
                      )}
                      {item.metadata?.scheduledDate && (
                        <Tag color="default">
                          Scheduled: {formatDate(item.metadata.scheduledDate as string)}
                          {item.metadata.daysLate != null && ` · ${item.metadata.daysLate} days late`}
                        </Tag>
                      )}
                    </div>
                  )}

                  <div className="notification-card__footer">
                    <Space wrap>
                      {needsAction ? (
                        <>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => handleContinue(item)}
                          >
                            Continue
                          </Button>
                          <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleStop(item)}>
                            Stop
                          </Button>
                        </>
                      ) : item.metadata?.deliveryId ? (
                        <Button
                          type="default"
                          size="small"
                          icon={<CarOutlined />}
                          onClick={() => navigate('/deliveries')}
                        >
                          View Deliveries
                        </Button>
                      ) : (
                        <Text type="secondary">
                          <InboxOutlined /> Informational
                        </Text>
                      )}
                    </Space>

                    {!item.isRead && (
                      <Button type="link" size="small" onClick={() => markReadMutation.mutate(item._id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Spin>

      <Modal
        title={`Continue delivery — ${continueModal?.customerName}`}
        open={!!continueModal}
        onCancel={() => setContinueModal(null)}
        onOk={() => {
          if (!continueModal) return;
          decisionMutation.mutate({
            deliveryId: continueModal.deliveryId,
            action: 'continue',
            date: rescheduleDate.format('YYYY-MM-DD'),
          });
        }}
        confirmLoading={decisionMutation.isPending}
        okText="Continue Delivery"
      >
        <p className="mb-16">Pick a new delivery date to continue this customer&apos;s delivery.</p>
        <DatePicker
          className="w-full"
          value={rescheduleDate}
          onChange={(d) => d && setRescheduleDate(d)}
          disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
        />
      </Modal>
    </div>
  );
};
