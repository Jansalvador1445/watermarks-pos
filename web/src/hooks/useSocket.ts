import { useEffect } from 'react';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';

export const useSocket = () => {
  const { isAuthenticated } = useAuthStore();
  const { incrementUnread, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = initSocket();

    socket.on('notification', () => {
      incrementUnread();
    });

    socket.on('notification:badge', () => {
      incrementUnread();
    });

    socket.on('dashboard:update', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      socket.off('notification');
      socket.off('notification:badge');
      socket.off('dashboard:update');
    };
  }, [isAuthenticated, incrementUnread, setUnreadCount]);

  return { socket: getSocket() };
};
