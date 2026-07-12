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
      const response = await fetch(`http://localhost:4000/api/v1/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update collection');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.id] });
    },
  });
};
