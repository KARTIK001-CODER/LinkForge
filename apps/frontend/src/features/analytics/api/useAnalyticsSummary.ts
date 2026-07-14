import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number;
  topReferrer: string;
  topCountry: string;
  topBrowser: string;
  topDevice: string;
  totalLinks: number;
  avgRedirectDuration: number;
}

export const useAnalyticsSummary = (linkId: string, isRealtime?: boolean) => {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics', linkId, 'summary'],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/analytics/links/${linkId}/summary`);
      return response.data;
    },
    enabled: !!linkId,
    staleTime: isRealtime ? 5_000 : 15_000,
    refetchInterval: isRealtime ? 10_000 : false,
    refetchOnWindowFocus: true,
  });
};
