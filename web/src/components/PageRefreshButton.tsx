import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { usePageRefresh, type PageRefreshTarget } from '@/hooks/usePageRefresh';

interface PageRefreshButtonProps {
  targets: readonly PageRefreshTarget[];
}

export const PageRefreshButton = ({ targets }: PageRefreshButtonProps) => {
  const { refresh, isRefreshing } = usePageRefresh(targets);

  return (
    <Button
      icon={<ReloadOutlined />}
      onClick={() => void refresh()}
      loading={isRefreshing}
      aria-label="Refresh page data"
    >
      Refresh
    </Button>
  );
};
