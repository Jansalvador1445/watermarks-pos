import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import { APP_NAME } from '@/utils/constants';

export const useCompanySettings = () => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  return {
    companyName: settings?.companyName ?? APP_NAME,
    defaultSlimPrice: settings?.pricing?.defaultSlimPrice ?? 35,
    defaultRoundPrice: settings?.pricing?.defaultRoundPrice ?? 40,
    settings,
  };
};
