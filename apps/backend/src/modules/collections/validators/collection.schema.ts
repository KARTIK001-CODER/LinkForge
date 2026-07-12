import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500).optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export type CreateCollectionDto = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionDto = z.infer<typeof updateCollectionSchema>;
