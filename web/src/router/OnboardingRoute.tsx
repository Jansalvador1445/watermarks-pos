import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingRouteProps {
  children: React.ReactNode;
}

export const OnboardingRoute = ({ children }: OnboardingRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchMe } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe()
        .catch(() => {})
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, fetchMe]);

  if (checking) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
