import { z } from 'zod';

export const createLinkSchema = z.object({
  destinationUrl: z.string().url().max(2048),
  customAlias: z.string().min(4).max(50).regex(/^[a-zA-Z0-9-]+$/).optional(),
  password: z.string().min(8).max(255).optional(),
  expiresAt: z.string().datetime().optional().refine((val) => {
    if (!val) return true;
    return new Date(val) > new Date();
  }, { message: "expiresAt must be in the future" }),
  tags: z.array(z.string().max(20)).max(10).optional(),
});

export type CreateLinkDto = z.infer<typeof createLinkSchema>;
