import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface BreakdownData {
  name: string;
  clicks: number;
}

export const useAnalyticsBreakdown = (linkId: string, dimension: string, isRealtime?: boolean) => {
  return useQuery<{ dimension: string; data: BreakdownData[] }>({
    queryKey: ['analytics', linkId, 'breakdown', dimension],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/analytics/links/${linkId}/breakdown?dimension=${dimension}`);
      return response.data;
    },
    enabled: !!linkId && !!dimension,
    staleTime: isRealtime ? 15_000 : 60_000,
    refetchInterval: isRealtime ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
};
