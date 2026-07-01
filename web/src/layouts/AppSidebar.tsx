import { useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Typography, Dropdown, Grid } from 'antd';
import type { MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  DashboardOutlined,
  TeamOutlined,
  CarOutlined,
  TransactionOutlined,
  ShoppingCartOutlined,
  ExperimentOutlined,
  InboxOutlined,
  BarChartOutlined,
  HistoryOutlined,
  BellOutlined,
  UserOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/useAuth';
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm';
import { WaterDropIcon } from '@/components/icons/WaterDropIcon';
import { MENU_GROUPS, SIDEBAR_WIDTH } from '@/utils/constants';
import { dashboardApi, healthApi } from '@/services/api';
import { formatDateTime } from '@/utils/formatters';

const { Sider } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  TeamOutlined: <TeamOutlined />,
  CarOutlined: <CarOutlined />,
  TransactionOutlined: <TransactionOutlined />,
  ShoppingCartOutlined: <ShoppingCartOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  InboxOutlined: <InboxOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  HistoryOutlined: <HistoryOutlined />,
  BellOutlined: <BellOutlined />,
  UserOutlined: <UserOutlined />,
  CloudUploadOutlined: <CloudUploadOutlined />,
  SettingOutlined: <SettingOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  DollarOutlined: <DollarOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
};

const flattenMenuKeys = (items: MenuProps['items']): string[] => {
  const keys: string[] = [];
  items?.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    if ('children' in item && item.children) {
      item.children.forEach((child) => {
        if (child && typeof child === 'object' && 'key' in child && child.key) {
          keys.push(String(child.key));
        }
      });
    } else if ('key' in item && item.key && !String(item.key).startsWith('group-')) {
      keys.push(String(item.key));
    }
  });
  return keys;
};

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { user } = useAuth();
  const { confirmLogout } = useLogoutConfirm();
  const { hasPermission } = usePermission();

  const { data: systemSummary } = useQuery({
    queryKey: ['dashboard', 'system-summary'],
    queryFn: () => dashboardApi.systemSummary().then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.check().then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const menuItems: MenuProps['items'] = useMemo(() => {
    return MENU_GROUPS.map((group) => {
      const visibleItems = group.items
        .filter((item) => hasPermission(item.permission))
        .map((item) => ({
          key: item.key,
          icon: iconMap[item.icon],
          label: item.label,
        }));

      if (visibleItems.length === 0) return null;

      return {
        type: 'group' as const,
        label: group.label,
        key: `group-${group.key}`,
        children: visibleItems,
      };
    }).filter(Boolean) as MenuProps['items'];
  }, [hasPermission]);

  const allKeys = useMemo(() => flattenMenuKeys(menuItems), [menuItems]);

  const selectedKey =
    allKeys.find((key) => location.pathname === key || location.pathname.startsWith(`${key}/`)) ||
    '/dashboard';

  const userMenu: MenuProps = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/settings') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: confirmLogout },
    ],
  };

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile, setMobileSidebarOpen]);

  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile, setMobileSidebarOpen]);

  const collapsed = isMobile ? false : sidebarCollapsed;

  return (
    <Sider
      collapsible={!isMobile}
      collapsed={collapsed}
      onCollapse={isMobile ? undefined : setSidebarCollapsed}
      width={SIDEBAR_WIDTH}
      className={`app-sidebar${isMobile ? ' app-sidebar--mobile' : ''}${isMobile && mobileSidebarOpen ? ' app-sidebar--open' : ''}`}
      trigger={null}
      collapsedWidth={isMobile ? SIDEBAR_WIDTH : 80}
    >
      <div className="app-sidebar__brand">
        <WaterDropIcon className="app-sidebar__logo" />
        {!collapsed && (
          <div>
            <Text strong className="app-sidebar__brand-title">
              WATER REFILLING STATION POS
            </Text>
          </div>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => {
          if (key.startsWith('/')) navigate(key);
        }}
        className="app-sidebar__menu"
      />

      {!collapsed && (
        <div className="sidebar-system-info">
          <div className="sidebar-system-info__row">
            <span className="sidebar-system-info__label">Version</span>
            <span>{health?.version ?? systemSummary?.version ?? '—'}</span>
          </div>
          <div className="sidebar-system-info__row">
            <span className="sidebar-system-info__label">Database</span>
            <span className="sidebar-system-info__status">
              <span
                className={`sidebar-system-info__dot${health?.database !== 'connected' ? ' sidebar-system-info__dot--offline' : ''}`}
              />
              {health?.database === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="sidebar-system-info__row">
            <span className="sidebar-system-info__label">Low Stock</span>
            <span className="sidebar-system-info__value">{systemSummary?.lowStockItems ?? 0}</span>
          </div>
          <div className="sidebar-system-info__row">
            <span className="sidebar-system-info__label">Last Backup</span>
            <span className="sidebar-system-info__value">
              {systemSummary?.lastBackup ? formatDateTime(systemSummary.lastBackup as string) : '—'}
            </span>
          </div>
        </div>
      )}

      <div className="app-sidebar__footer">
        <Dropdown menu={userMenu} placement="topLeft" trigger={['click']}>
          <button type="button" className="app-sidebar__user">
            <Avatar size={36} icon={<UserOutlined />} src={user?.avatar} className="app-sidebar__avatar">
              {user?.name?.charAt(0)}
            </Avatar>
            {!collapsed && (
              <div className="flex-1 app-sidebar__user-info">
                <Text strong ellipsis className="block text-sm">
                  {user?.name || 'Admin User'}
                </Text>
                <Text type="secondary" className="text-xs">
                  {user?.role === 'admin'
                    ? 'Administrator'
                    : user?.role === 'cashier'
                      ? 'Cashier / Finance'
                      : user?.role === 'delivery_staff'
                        ? 'Delivery Staff'
                        : user?.role === 'custom'
                          ? 'Custom Role'
                          : 'User'}
                </Text>
              </div>
            )}
            {!collapsed && <DownOutlined className="app-sidebar__chevron" />}
          </button>
        </Dropdown>
      </div>
    </Sider>
  );
};
