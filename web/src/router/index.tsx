import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingPage } from '@/features/auth/OnboardingPage';
import { OnboardingRoute } from '@/router/OnboardingRoute';
import { NotFoundPage, ServerErrorPage } from '@/pages/ErrorPages';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const DeliveriesPage = lazy(() => import('@/features/deliveries/DeliveriesPage').then((m) => ({ default: m.DeliveriesPage })));
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage').then((m) => ({ default: m.TransactionsPage })));
const POSPage = lazy(() => import('@/features/pos/POSPage').then((m) => ({ default: m.POSPage })));
const ItemTrackingPage = lazy(() => import('@/features/gallons/ItemTrackingPage').then((m) => ({ default: m.ItemTrackingPage })));
const InventoryPage = lazy(() => import('@/features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const BackupPage = lazy(() => import('@/features/backup/BackupPage').then((m) => ({ default: m.BackupPage })));
const LogsPage = lazy(() => import('../features/logs/LogsPage').then((m) => ({ default: m.LogsPage })));
const InvoicesPage = lazy(() => import('@/features/orders/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));
const DailyCollectionPage = lazy(() => import('@/features/collection/DailyCollectionPage').then((m) => ({ default: m.DailyCollectionPage })));
const DeliveredHistoryPage = lazy(() => import('@/features/deliveries/DeliveredHistoryPage').then((m) => ({ default: m.DeliveredHistoryPage })));

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="route-loading"><Spin size="large" /></div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/onboarding',
    element: (
      <OnboardingRoute>
        <OnboardingPage />
      </OnboardingRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <LazyLoad><DashboardPage /></LazyLoad> },
      { path: 'customers', element: <LazyLoad><CustomersPage /></LazyLoad> },
      { path: 'deliveries', element: <LazyLoad><DeliveriesPage /></LazyLoad> },
      { path: 'water-orders', element: <LazyLoad><InvoicesPage /></LazyLoad> },
      { path: 'daily-collection', element: <LazyLoad><DailyCollectionPage /></LazyLoad> },
      { path: 'delivered-history', element: <LazyLoad><DeliveredHistoryPage /></LazyLoad> },
      { path: 'transactions', element: <LazyLoad><TransactionsPage /></LazyLoad> },
      { path: 'pos', element: <LazyLoad><POSPage /></LazyLoad> },
      { path: 'gallons', element: <LazyLoad><ItemTrackingPage /></LazyLoad> },
      { path: 'inventory', element: <LazyLoad><InventoryPage /></LazyLoad> },
      { path: 'reports', element: <LazyLoad><ReportsPage /></LazyLoad> },
      { path: 'users', element: <LazyLoad><UsersPage /></LazyLoad> },
      { path: 'settings', element: <LazyLoad><SettingsPage /></LazyLoad> },
      { path: 'notifications', element: <LazyLoad><NotificationsPage /></LazyLoad> },
      { path: 'backup', element: <LazyLoad><BackupPage /></LazyLoad> },
      { path: 'logs', element: <LazyLoad><LogsPage /></LazyLoad> },
      { path: '500', element: <ServerErrorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
