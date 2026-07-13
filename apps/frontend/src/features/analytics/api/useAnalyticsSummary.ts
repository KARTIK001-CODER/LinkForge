import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number;
  topReferrer: string;
  topCountry: string;
}

export const useAnalyticsSummary = (linkId: string) => {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics', linkId, 'summary'],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/analytics/links/${linkId}/summary`);
      return response.data;
    },
    enabled: !!linkId,
    staleTime: 15_000,
  });
};
