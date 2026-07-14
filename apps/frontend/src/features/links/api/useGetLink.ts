import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { LinkItem } from './useGetLinks';

export interface GetLinkResponse {
  success: boolean;
  data: LinkItem & { clicks: number; updatedAt: string };
}

export const useGetLink = (alias: string) => {
  return useQuery({
    queryKey: ['link', alias],
    queryFn: async (): Promise<GetLinkResponse> => {
      const response = await axios.get(`/api/v1/links/${alias}`);
      return response.data;
    },
    retry: false,
  });
};
