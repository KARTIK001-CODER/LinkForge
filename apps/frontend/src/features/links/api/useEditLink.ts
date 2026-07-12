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
      const response = await fetch(`http://localhost:4000/api/v1/links/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to edit link');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the links list so it refreshes with updated data
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
};
