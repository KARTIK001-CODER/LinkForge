import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { GetCollectionResponse } from './types';

export const useGetCollection = (id: string | null) => {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: async (): Promise<GetCollectionResponse> => {
      if (!id) throw new Error('Collection ID is required');
      const response = await axios.get(`/api/v1/collections/${id}`);
      
      return response.data;
    },
    enabled: !!id,
  });
};
