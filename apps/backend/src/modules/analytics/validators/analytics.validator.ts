import { z } from 'zod';

export const RawAnalyticsEventSchema = z.object({
  linkId: z.string().uuid(),
  ip: z.string(),
  userAgent: z.string(),
  timestamp: z.date(),
  referrer: z.string().optional(),
  originalUrl: z.string().optional(),
});

export const AnalyticsQuerySchema = z.object({
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),   // ISO date string
  interval: z.enum(['hour', 'day', 'month']).optional().default('day'),
});

export type AnalyticsQueryDto = z.infer<typeof AnalyticsQuerySchema>;
