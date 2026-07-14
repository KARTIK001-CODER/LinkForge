import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface UpdateCollectionPayload {
  id: string;
  name?: string;
  description?: string;
}

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCollectionPayload) => {
      const response = await axios.patch(`http://localhost:4000/api/v1/collections/${id}`, payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.id] });
    },
  });
};
