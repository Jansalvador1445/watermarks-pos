import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';

export type PageRefreshTarget =
  | string
  | { prefix: string }
  | { queryKey: readonly unknown[] };

async function refetchTarget(
  queryClient: ReturnType<typeof useQueryClient>,
  target: PageRefreshTarget,
) {
  if (typeof target === 'string') {
    await queryClient.refetchQueries({ queryKey: [target], type: 'active' });
    return;
  }
  if ('prefix' in target) {
    await queryClient.refetchQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith(target.prefix),
      type: 'active',
    });
    return;
  }
  await queryClient.refetchQueries({ queryKey: target.queryKey, type: 'active' });
}

export function usePageRefresh(targets: readonly PageRefreshTarget[]) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (targets.length === 0) return;
    setIsRefreshing(true);
    try {
      await Promise.all(targets.map((target) => refetchTarget(queryClient, target)));
      message.success('Data refreshed');
    } catch {
      message.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, message, targets]);

  return { refresh, isRefreshing };
}
