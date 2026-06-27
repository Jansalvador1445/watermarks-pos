import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_PERMISSIONS } from '@/utils/constants';
import { matchPermission } from '@/utils/permissions';
import { authApi } from '@/services/api';
import type { User } from '@/types';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout: clearAuth } = useAuthStore();

  const login = useCallback(
    async (identifier: string, password: string) => {
      const { data } = await authApi.login(identifier, password);
      setUser(data.data.user);
      return data.data.user as User;
    },
    [setUser],
  );

  const completeOnboarding = useCallback(
    async (payload: { username: string; email: string; password: string }) => {
      const { data } = await authApi.onboarding(payload);
      setUser(data.data.user);
      return data.data.user as User;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  }, [clearAuth]);

  const fetchMe = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data.data);
    return data.data as User;
  }, [setUser]);

  return { user, isAuthenticated, login, logout, fetchMe, completeOnboarding };
};

export const usePermission = () => {
  const { user } = useAuthStore();

  const getPermissions = useCallback((): string[] => {
    if (!user) return [];
    if (user.role === 'admin') return ['*'];
    if (user.customPermissions?.length) return user.customPermissions;
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return matchPermission(getPermissions(), permission);
    },
    [getPermissions],
  );

  const isAdmin = user?.role === 'admin';

  return { hasPermission, isAdmin, role: user?.role, permissions: getPermissions() };
};
