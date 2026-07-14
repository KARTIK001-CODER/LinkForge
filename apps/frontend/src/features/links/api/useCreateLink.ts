import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CreateLinkPayload {
  destinationUrl: string;
  customAlias?: string;
  password?: string;
  expiresAt?: string;
  tags?: string[];
}

export const useCreateLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLinkPayload) => {
      const response = await axios.post('http://localhost:4000/api/v1/links', payload);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
};
