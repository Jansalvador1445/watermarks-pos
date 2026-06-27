import { App } from 'antd';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useLogoutConfirm = () => {
  const { modal } = App.useApp();
  const { logout } = useAuth();

  const confirmLogout = useCallback(() => {
    modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to log out? You will need to sign in again to access the admin panel.',
      okText: 'Logout',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: () => logout(),
    });
  }, [logout, modal]);

  return { confirmLogout };
};
