import Redis from 'ioredis';

export class AnalyticsCache {
  private static instance: Redis | null = null;
  private static CACHE_PREFIX = 'analytics:cache:';
  private static DEFAULT_TTL = 60;

  static getClient(): Redis | null {
    if (this.instance) return this.instance;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return null;

    try {
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        commandTimeout: 100,
        lazyConnect: true,
      });
      this.instance.on('error', () => {});
      return this.instance;
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = AnalyticsCache.getClient();
    if (!client) return null;
    try {
      const data = await client.get(`${AnalyticsCache.CACHE_PREFIX}${key}`);
      return data ? JSON.parse(data) as T : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = AnalyticsCache.getClient();
    if (!client) return;
    try {
      await client.setex(
        `${AnalyticsCache.CACHE_PREFIX}${key}`,
        ttlSeconds || AnalyticsCache.DEFAULT_TTL,
        JSON.stringify(value)
      );
    } catch {}
  }

  async invalidate(linkId: string): Promise<void> {
    const client = AnalyticsCache.getClient();
    if (!client) return;
    try {
      const pattern = `${AnalyticsCache.CACHE_PREFIX}${linkId}:*`;
      const stream = client.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream) {
        if (keys.length > 0) {
          await client.del(...keys);
        }
      }
    } catch {}
  }

  async invalidateLinkCache(linkId: string): Promise<void> {
    const client = AnalyticsCache.getClient();
    if (!client) return;
    try {
      const patterns = [
        `${AnalyticsCache.CACHE_PREFIX}${linkId}:summary`,
        `${AnalyticsCache.CACHE_PREFIX}${linkId}:timeseries:*`,
        `${AnalyticsCache.CACHE_PREFIX}${linkId}:breakdown:*`,
        `${AnalyticsCache.CACHE_PREFIX}${linkId}:realtime`,
      ];
      const pipeline = client.pipeline();
      for (const pattern of patterns) {
        const stream = client.scanStream({ match: pattern, count: 100 });
        for await (const keys of stream) {
          if (keys.length > 0) {
            pipeline.del(...keys);
          }
        }
      }
      await pipeline.exec();
    } catch {}
  }

  async getCacheHitRate(): Promise<{ hits: number; misses: number; rate: number }> {
    const client = AnalyticsCache.getClient();
    if (!client) return { hits: 0, misses: 0, rate: 0 };
    try {
      const hits = parseInt(await client.get(`${AnalyticsCache.CACHE_PREFIX}stats:hits`) || '0', 10);
      const misses = parseInt(await client.get(`${AnalyticsCache.CACHE_PREFIX}stats:misses`) || '0', 10);
      const total = hits + misses;
      return { hits, misses, rate: total > 0 ? (hits / total) * 100 : 0 };
    } catch {
      return { hits: 0, misses: 0, rate: 0 };
    }
  }

  async recordHit(): Promise<void> {
    const client = AnalyticsCache.getClient();
    if (!client) return;
    try {
      await client.incr(`${AnalyticsCache.CACHE_PREFIX}stats:hits`);
    } catch {}
  }

  async recordMiss(): Promise<void> {
    const client = AnalyticsCache.getClient();
    if (!client) return;
    try {
      await client.incr(`${AnalyticsCache.CACHE_PREFIX}stats:misses`);
    } catch {}
  }

  async incrementWorkerMetric(metric: string): Promise<void> {
    const client = AnalyticsCache.getClient();
    if (!client) return;
    try {
      await client.incr(`analytics:metrics:${metric}`);
      await client.expire(`analytics:metrics:${metric}`, 86400);
    } catch {}
  }

  async getWorkerMetrics(): Promise<Record<string, number>> {
    const client = AnalyticsCache.getClient();
    if (!client) return {};
    try {
      const keys = await client.keys('analytics:metrics:*');
      if (keys.length === 0) return {};
      const values = await client.mget(...keys);
      const result: Record<string, number> = {};
      for (let i = 0; i < keys.length; i++) {
        const name = keys[i].replace('analytics:metrics:', '');
        result[name] = parseInt(values[i] || '0', 10);
      }
      return result;
    } catch {
      return {};
    }
  }
}
