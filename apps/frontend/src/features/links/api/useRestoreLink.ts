import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useRestoreLink = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.patch(`http://localhost:4000/api/v1/links/${id}/restore`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
};
