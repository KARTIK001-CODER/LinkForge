import Redis from 'ioredis';
import { RawAnalyticsEvent } from '../models/analytics.domain';

export class AnalyticsProducer {
  private static instance: Redis | null = null;
  private static readonly STREAM_KEY = 'analytics:events';
  private static droppedCount = 0;

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
        commandTimeout: 100,
      });

      this.instance.on('error', (err: any) => {
        if (err.message && err.message.includes('ECONNREFUSED')) {
          if (this.droppedCount % 100 === 0) {
            console.warn('[AnalyticsProducer] Redis connection refused');
          }
          this.droppedCount++;
          return;
        }
        if (err.code === 'ECONNREFUSED') {
          this.droppedCount++;
          return;
        }
      });

      this.instance.on('connect', () => {
        console.log('[AnalyticsProducer] Connected to Redis');
        this.droppedCount = 0;
      });

      return this.instance;
    } catch (e: any) {
      console.warn(`[AnalyticsProducer] Initialization Failed: ${e.message}`);
      return null;
    }
  }

  static async publishEvent(event: RawAnalyticsEvent): Promise<void> {
    const client = this.getClient();
    if (!client) {
      this.droppedCount++;
      if (this.droppedCount % 100 === 1) {
        console.warn(`[AnalyticsProducer] Dropped event #${this.droppedCount} — Redis not available`);
      }
      return;
    }

    try {
      await client.xadd(this.STREAM_KEY, '*', 'payload', JSON.stringify(event));
    } catch (error: any) {
      this.droppedCount++;
      if (this.droppedCount % 10 === 1) {
        console.error(`[AnalyticsProducer] Failed to publish event #${this.droppedCount}: ${error.message}`);
      }
    }
  }
}
