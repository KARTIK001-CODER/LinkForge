import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface GetLinksParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: string;
  isFavorite?: string;
  collectionId?: string;
}

export interface LinkItem {
  id: string;
  userId?: string | null;
  alias: string;
  shortUrl: string;
  destinationUrl: string;
  title?: string | null;
  description?: string | null;
  hasPassword: boolean;
  expiresAt: string | null;
  status: string;
  tags: string[];
  isFavorite: boolean;
  collectionId?: string | null;
  createdAt: string;
  trafficVariants?: TrafficVariant[] | null;
}

export interface TrafficVariant {
  url: string;
  weight: number;
}

export interface GetLinksResponse {
  success: boolean;
  data: {
    items: LinkItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
}

export const useGetLinks = (params: GetLinksParams) => {
  return useQuery({
    queryKey: ['links', params],
    queryFn: async (): Promise<GetLinksResponse> => {
      const response = await axios.get('/api/v1/links', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
