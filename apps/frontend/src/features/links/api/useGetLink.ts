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
      const response = await fetch(`/api/v1/links/${alias}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Link not found');
        }
        throw new Error('Failed to fetch link details');
      }
      return response.json();
    },
    retry: false,
  });
};
