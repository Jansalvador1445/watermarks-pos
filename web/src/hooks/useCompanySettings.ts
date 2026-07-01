import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';

export const useCompanySettings = () => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  return {
    companyName: settings?.companyName ?? 'Water Refilling Station POS',
    defaultSlimPrice: settings?.pricing?.defaultSlimPrice ?? 35,
    defaultRoundPrice: settings?.pricing?.defaultRoundPrice ?? 40,
    settings,
  };
};
