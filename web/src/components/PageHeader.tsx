import { Typography, Breadcrumb, Space } from 'antd';
import { motion } from 'framer-motion';
import { PageRefreshButton } from './PageRefreshButton';
import type { PageRefreshTarget } from '@/hooks/usePageRefresh';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: Array<{ title: string; href?: string }>;
  extra?: React.ReactNode;
  refreshQueryKeys?: readonly PageRefreshTarget[];
}

export const PageHeader = ({ title, subtitle, breadcrumb, extra, refreshQueryKeys }: PageHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="page-header"
  >
    {breadcrumb && (
      <Breadcrumb
        className="page-header__breadcrumb"
        items={breadcrumb.map((b) => ({ title: b.title, href: b.href }))}
      />
    )}
    <div className="page-header__row">
      <div>
        <Title level={3} className="page-header__title">
          {title}
        </Title>
        {subtitle && <div className="page-header__subtitle">{subtitle}</div>}
      </div>
      {(refreshQueryKeys?.length || extra) && (
        <div className="page-header__actions">
          <Space wrap>
            {refreshQueryKeys && refreshQueryKeys.length > 0 && (
              <PageRefreshButton targets={refreshQueryKeys} />
            )}
            {extra}
          </Space>
        </div>
      )}
    </div>
  </motion.div>
);
