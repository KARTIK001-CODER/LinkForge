import { z } from 'zod';

export const getLinksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.preprocess((val) => val === '' ? undefined : val, z.enum(['ACTIVE', 'EXPIRED', 'DISABLED', 'ARCHIVED']).optional()),
  isFavorite: z.preprocess((val) => val === '' ? undefined : val, z.enum(['true', 'false']).transform((val) => val === 'true').optional()),
  collectionId: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  tags: z.string().optional(), // Comma separated string from query param
  sortBy: z.enum(['createdAt', 'alias']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetLinksQuery = z.infer<typeof getLinksSchema>;
