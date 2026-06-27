import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Input, Badge, Dropdown, Avatar, Button, AutoComplete, Spin, Grid } from 'antd';
import type { AutoCompleteProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useUIStore } from '@/store/uiStore';
import { useAuth, usePermission } from '@/hooks/useAuth';
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm';
import { useNotificationStore } from '@/store/notificationStore';
import { useDebounce } from '@/hooks/useDebounce';
import { searchApi } from '@/services/api';
import { notificationApi } from '@/services/api';
import { formatDate } from '@/utils/formatters';
import {
  buildGroupedSearchOptions,
  flattenSearchOptions,
  searchSidebarPages,
  type SearchOption,
  type SearchOptionGroup,
} from '@/utils/globalSearchHelpers';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const getCustomerName = (customerId: unknown): string => {
  if (customerId && typeof customerId === 'object' && 'fullName' in customerId) {
    return String((customerId as { fullName: string }).fullName);
  }
  return 'Unknown';
};

export const AppHeader = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isCompactSearch = !screens.sm;
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen } =
    useUIStore();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { confirmLogout } = useLogoutConfirm();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useQuery({
    queryKey: ['notifications', 'badge'],
    queryFn: () =>
      notificationApi.list({ limit: 1 }).then((r) => {
        setUnreadCount(r.data.data.unreadCount || 0);
        return r.data.data.unreadCount;
      }),
    staleTime: 30_000,
  });

  const [searchValue, setSearchValue] = useState('');
  const [apiOptions, setApiOptions] = useState<SearchOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 400);

  const pageOptions = useMemo(
    () => searchSidebarPages(searchValue, hasPermission),
    [searchValue, hasPermission],
  );

  const searchOptionGroups: SearchOptionGroup[] = useMemo(() => {
    const customerOptions = apiOptions.filter((o) => o.type === 'customer');
    const transactionOptions = apiOptions.filter((o) => o.type === 'transaction');
    const deliveryOptions = apiOptions.filter((o) => o.type === 'delivery');
    const userOptions = apiOptions.filter((o) => o.type === 'user');

    return buildGroupedSearchOptions([
      { label: 'Pages', options: pageOptions.map((o) => ({ ...o, label: `Page: ${o.label}` })) },
      { label: 'Customers', options: customerOptions },
      { label: 'Invoices', options: transactionOptions },
      { label: 'Deliveries', options: deliveryOptions },
      { label: 'Users', options: userOptions },
    ]);
  }, [pageOptions, apiOptions]);

  const flatSearchOptions = useMemo(() => flattenSearchOptions(searchOptionGroups), [searchOptionGroups]);

  useEffect(() => {
    if (!isCompactSearch) {
      setSearchExpanded(false);
    }
  }, [isCompactSearch]);

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term.length < 2) {
      setApiOptions([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchApi
      .global(debouncedSearch)
      .then(({ data }) => {
        if (cancelled) return;

        const options: SearchOption[] = [];

        data.data.customers?.forEach((c: { _id: string; fullName: string }) => {
          options.push({
            value: `customer-${c._id}`,
            label: `Customer: ${c.fullName}`,
            route: `/customers?search=${encodeURIComponent(c.fullName)}`,
            type: 'customer',
          });
        });

        data.data.transactions?.forEach((t: { _id: string; invoiceNo: string }) => {
          options.push({
            value: `transaction-${t._id}`,
            label: `Invoice: ${t.invoiceNo}`,
            route: `/transactions?search=${encodeURIComponent(t.invoiceNo)}`,
            type: 'transaction',
          });
        });

        data.data.deliveries?.forEach((d: { _id: string; customerId: unknown; date: string }) => {
          const name = getCustomerName(d.customerId);
          options.push({
            value: `delivery-${d._id}`,
            label: `Delivery: ${name} (${formatDate(d.date)})`,
            route: `/deliveries?search=${encodeURIComponent(name)}`,
            type: 'delivery',
          });
        });

        data.data.users?.forEach((u: { _id: string; name: string }) => {
          options.push({
            value: `user-${u._id}`,
            label: `User: ${u.name}`,
            route: `/users?search=${encodeURIComponent(u.name)}`,
            type: 'user',
          });
        });

        setApiOptions(options);
      })
      .catch(() => {
        if (!cancelled) setApiOptions([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const handleSearchSelect = (_value: string, option: SearchOption) => {
    navigate(option.route);
    setSearchValue('');
    setApiOptions([]);
    setSearchExpanded(false);
    if (isMobile) setMobileSidebarOpen(false);
  };

  const handleMenuToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
      return;
    }
    toggleSidebar();
  };

  const profileMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/settings') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: confirmLogout },
    ],
  };

  const hasSearchQuery = searchValue.trim().length > 0;
  const showNotFound = hasSearchQuery && !searching && flatSearchOptions.length === 0;

  const searchInput = (
    <AutoComplete
      className="app-header__search"
      popupClassName="app-header__search-dropdown"
      options={searchOptionGroups as AutoCompleteProps['options']}
      onSelect={(value) => {
        const option = flatSearchOptions.find((item) => item.value === value);
        if (option) handleSearchSelect(value, option);
      }}
      notFoundContent={showNotFound ? 'No results found' : null}
    >
      <Input
        placeholder="Search pages, customers, invoices..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onPressEnter={() => {
          if (flatSearchOptions.length > 0) {
            handleSearchSelect(flatSearchOptions[0].value, flatSearchOptions[0]);
          }
        }}
        suffix={
          searching ? (
            <Spin size="small" />
          ) : (
            <SearchOutlined className="app-header__search-icon" />
          )
        }
        className="app-header__search-input"
        aria-label="Global search"
        autoFocus={isCompactSearch && searchExpanded}
      />
    </AutoComplete>
  );

  return (
    <>
      <Header className={`app-header app-header--refined${searchExpanded ? ' app-header--search-expanded' : ''}`}>
        <div className="app-header__inner">
          <div className="app-header__left">
            <Button
              type="text"
              className="app-header__menu-btn"
              icon={
                isMobile
                  ? mobileSidebarOpen
                    ? <MenuFoldOutlined />
                    : <MenuUnfoldOutlined />
                  : sidebarCollapsed
                    ? <MenuUnfoldOutlined />
                    : <MenuFoldOutlined />
              }
              onClick={handleMenuToggle}
              aria-label="Toggle navigation"
            />
          </div>

          {!isCompactSearch && <div className="app-header__center">{searchInput}</div>}

          <div className="app-header__right">
            {isCompactSearch && (
              <Button
                type="text"
                className="app-header__action-btn"
                icon={<SearchOutlined />}
                onClick={() => setSearchExpanded(true)}
                aria-label="Open search"
              />
            )}

            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                className="app-header__action-btn"
                icon={<BellOutlined className="icon-bell" />}
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              />
            </Badge>

            <Dropdown menu={profileMenu} placement="bottomRight" trigger={['click']}>
              <button type="button" className="app-header__profile-btn">
                <Avatar size={36} icon={<UserOutlined />} src={user?.avatar} className="app-header__avatar">
                  {user?.name?.charAt(0)}
                </Avatar>
                <span className="app-header__profile-name">{user?.name || 'Admin User'}</span>
                <DownOutlined className="app-header__profile-chevron" />
              </button>
            </Dropdown>
          </div>
        </div>
      </Header>

      {isCompactSearch && searchExpanded && (
        <div className="app-header-search-panel">
          <div className="app-header-search-panel__inner">
            {searchInput}
            <Button
              type="text"
              className="app-header-search-panel__close"
              icon={<CloseOutlined />}
              onClick={() => {
                setSearchExpanded(false);
                setSearchValue('');
                setApiOptions([]);
              }}
              aria-label="Close search"
            />
          </div>
        </div>
      )}
    </>
  );
};
