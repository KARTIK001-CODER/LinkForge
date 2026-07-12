import { z } from 'zod';

export const editLinkSchema = z.object({
  destinationUrl: z.string().url().max(2048).optional(),
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
  collectionId: z.string().uuid().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type EditLinkDto = z.infer<typeof editLinkSchema>;
