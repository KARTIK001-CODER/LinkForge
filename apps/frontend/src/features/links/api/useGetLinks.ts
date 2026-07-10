import { useQuery } from '@tanstack/react-query';

interface GetLinksParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface LinkItem {
  id: string;
  alias: string;
  shortUrl: string;
  destinationUrl: string;
  hasPassword: boolean;
  expiresAt: string | null;
  status: string;
  tags: string[];
  createdAt: string;
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
      const url = new URL('http://localhost:4000/api/v1/links');
      
      // Append valid params to query string
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
