import Redis from 'ioredis';
import { RawAnalyticsEvent } from '../models/analytics.domain';

export class AnalyticsProducer {
  private static instance: Redis | null = null;
  private static readonly STREAM_KEY = 'analytics:events';

  private static getClient(): Redis | null {
    if (this.instance) return this.instance;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('[AnalyticsProducer] REDIS_URL not configured. Analytics disabled.');
      return null;
    }

    try {
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

      this.instance.on('error', (err: any) => {
        if (err.message && err.message.includes('ECONNREFUSED')) return;
        if (err.name === 'AggregateError') return;
        if (err.code === 'ECONNREFUSED') return;
      });

      return this.instance;
    } catch (e: any) {
      console.warn(`[AnalyticsProducer] Initialization Failed: ${e.message}`);
      return null;
    }
  }

  static async publishEvent(event: RawAnalyticsEvent): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      // Fire and forget publishing to a Redis stream
      // We stringify the event, pushing it as a hash field 'payload'
      await client.xadd(this.STREAM_KEY, '*', 'payload', JSON.stringify(event));
    } catch (error) {
      // console.error('[AnalyticsProducer] Failed to publish event', error);
      // We swallow the error here because the redirect engine MUST NOT fail if analytics fails
    }
  }
}
