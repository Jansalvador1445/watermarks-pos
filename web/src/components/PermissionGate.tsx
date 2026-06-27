import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/useAuth';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate = ({ permission, children, fallback = null }: PermissionGateProps) => {
  const { hasPermission } = usePermission();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
};
