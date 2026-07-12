import { useQuery } from '@tanstack/react-query';
import type { GetCollectionResponse } from './types';

export const useGetCollection = (id: string | null) => {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: async (): Promise<GetCollectionResponse> => {
      if (!id) throw new Error('Collection ID is required');
      const response = await fetch(`http://localhost:4000/api/v1/collections/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }
      return response.json();
    },
    enabled: !!id,
  });
};
