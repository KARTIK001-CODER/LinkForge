import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CreateCollectionPayload {
  name: string;
  description?: string;
}

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCollectionPayload) => {
      const response = await fetch('http://localhost:4000/api/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create collection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};
