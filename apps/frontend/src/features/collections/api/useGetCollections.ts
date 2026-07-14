import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { GetCollectionsResponse } from './types';

export const useGetCollections = () => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async (): Promise<GetCollectionsResponse> => {
      const response = await axios.get('/api/v1/collections');
      
      return response.data;
    },
  });
};
