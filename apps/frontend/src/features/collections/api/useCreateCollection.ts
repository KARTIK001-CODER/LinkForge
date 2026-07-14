import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CreateCollectionPayload {
  name: string;
  description?: string;
}

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCollectionPayload) => {
      const response = await axios.post('/api/v1/collections', payload);

      

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};
