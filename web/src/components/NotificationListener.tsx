import { useEffect } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/types';

const typeLabels: Record<string, string> = {
  overdue_delivery: 'Overdue Delivery',
  delivery_3day_late: '3+ Days Late',
  delivery_continue_decision: 'Action Required',
  low_inventory: 'Low Inventory',
  backup_reminder: 'Backup Reminder',
  payment_reminder: 'Payment Reminder',
};

export const NotificationListener = () => {
  const { isAuthenticated } = useAuthStore();
  const { incrementUnread } = useNotificationStore();
  const { notification } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = initSocket();

    const showPopup = (item: Notification) => {
      const isAction = item.type === 'delivery_continue_decision';
      notification.open({
        message: item.title,
        description: item.message,
        placement: 'topRight',
        duration: isAction ? 0 : 8,
        type: isAction ? 'warning' : item.type === 'delivery_3day_late' ? 'error' : 'info',
        btn: (
          <button
            type="button"
            className="ant-btn ant-btn-primary ant-btn-sm"
            onClick={() => {
              notification.destroy();
              navigate('/notifications');
            }}
          >
            View
          </button>
        ),
      });
    };

    socket.on('notification', (payload: Notification) => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (payload?.title) showPopup(payload);
    });

    socket.on('dashboard:update', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      socket.off('notification');
      socket.off('dashboard:update');
    };
  }, [isAuthenticated, incrementUnread, notification, navigate, queryClient]);

  return null;
};

export const getNotificationTypeLabel = (type: string) =>
  typeLabels[type] || type.replace(/_/g, ' ');
