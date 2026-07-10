import { z } from 'zod';

export const createLinkSchema = z.object({
  destinationUrl: z
    .string()
    .transform((val) => (val && !/^https?:\/\//i.test(val) ? `https://${val}` : val))
    .pipe(z.string().url("Please enter a valid URL").max(2048)),
  customAlias: z.string().regex(/^[a-zA-Z0-9-]+$/, "Only letters, numbers, and hyphens are allowed").min(4).max(50).optional().or(z.literal('')),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // we will split tags by comma in the component
});

export type CreateLinkFormData = z.infer<typeof createLinkSchema>;
