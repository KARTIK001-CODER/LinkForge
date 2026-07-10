import { useMutation } from '@tanstack/react-query';

export interface CreateLinkPayload {
  destinationUrl: string;
  customAlias?: string;
  password?: string;
  expiresAt?: string;
  tags?: string[];
}

export const useCreateLink = () => {
  return useMutation({
    mutationFn: async (payload: CreateLinkPayload) => {
      const response = await fetch('http://localhost:4000/api/v1/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create link');
      }

      return response.json();
    }
  });
};
