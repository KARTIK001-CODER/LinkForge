import { useQuery } from '@tanstack/react-query';
import type { GetCollectionsResponse } from './types';

export const useGetCollections = () => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async (): Promise<GetCollectionsResponse> => {
      const response = await fetch('http://localhost:4000/api/v1/collections');
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      return response.json();
    },
  });
};
