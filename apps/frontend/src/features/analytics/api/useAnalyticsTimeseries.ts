import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface TimeseriesData {
  timestamp: string;
  clicks: number;
  uniqueVisitors: number;
}

export const useAnalyticsTimeseries = (linkId: string, startDate?: string, endDate?: string) => {
  return useQuery<{ data: TimeseriesData[] }>({
    queryKey: ['analytics', linkId, 'timeseries', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(`/api/v1/analytics/links/${linkId}/timeseries?${params.toString()}`);
      return response.data;
    },
    enabled: !!linkId,
    staleTime: 30_000,
  });
};
