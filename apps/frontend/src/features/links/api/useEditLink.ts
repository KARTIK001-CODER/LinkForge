import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface EditLinkPayload {
  destinationUrl?: string;
  title?: string | null;
  description?: string | null;
  isActive?: boolean;
  tags?: string[];
}

export const useEditLink = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EditLinkPayload) => {
      const response = await axios.patch(`http://localhost:4000/api/v1/links/${id}`, payload);

      

      return response.data;
    },
    onSuccess: () => {
      // Invalidate the links list so it refreshes with updated data
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
};
