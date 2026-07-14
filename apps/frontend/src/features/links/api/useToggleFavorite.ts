import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GetLinksResponse } from './useGetLinks';

export const useToggleFavorite = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isFavorite: boolean) => {
      const endpoint = isFavorite ? 'favorite' : 'unfavorite';
      const response = await axios.patch(`http://localhost:4000/api/v1/links/${id}/${endpoint}`);
      return response.data;
    },
    onMutate: async (isFavorite) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['links'] });
      await queryClient.cancelQueries({ queryKey: ['link'] });

      // Snapshot the previous value
      const previousLinks = queryClient.getQueryData(['links']);
      const previousLink = queryClient.getQueryData(['link']);

      // Optimistically update all queries containing this link
      queryClient.setQueriesData({ queryKey: ['links'] }, (oldData: GetLinksResponse | undefined) => {
        if (!oldData || !oldData.data || !oldData.data.items) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(link => 
              link.id === id ? { ...link, isFavorite } : link
            )
          }
        };
      });

      // Optimistically update the single link query if it exists
      queryClient.setQueriesData({ queryKey: ['link'] }, (oldData: any) => {
        if (!oldData || !oldData.data || oldData.data.id !== id) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            isFavorite
          }
        };
      });

      // Return a context object with the snapshotted value
      return { previousLinks, previousLink };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTodo, context: any) => {
      if (context?.previousLinks) {
        queryClient.setQueriesData({ queryKey: ['links'] }, context.previousLinks);
      }
      if (context?.previousLink) {
        queryClient.setQueriesData({ queryKey: ['link'] }, context.previousLink);
      }
    },
    // Always refetch after error or success to ensure we're perfectly in sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['link'] });
    },
  });
};
