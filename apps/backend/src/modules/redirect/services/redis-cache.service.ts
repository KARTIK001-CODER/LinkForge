import Redis from 'ioredis';

export class RedisCacheService {
  private static instance: Redis | null = null;
  private static TTL_SECONDS = 86400; // 24 hours

  private static getClient(): Redis | null {
    if (this.instance) return this.instance;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('[RedisCache] REDIS_URL not configured. Running without cache.');
      return null;
    }

    try {
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        commandTimeout: 50, // Strict 50ms timeout on commands to prevent hanging
      });

      this.instance.on('error', (err) => {
        console.warn(`[RedisCache] Connection Error: ${err.message}. Gracefully falling back to Postgres.`);
        // Don't kill the app, just let the instance degrade
      });

      return this.instance;
    } catch (e: any) {
      console.warn(`[RedisCache] Initialization Failed: ${e.message}`);
      return null;
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`[RedisCache] Failed to get key ${key}`);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = this.TTL_SECONDS): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      const stringified = JSON.stringify(value);
      await client.setex(key, ttlSeconds, stringified);
    } catch (e) {
      console.warn(`[RedisCache] Failed to set key ${key}`);
    }
  }

  static async delete(key: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (e) {
      console.warn(`[RedisCache] Failed to delete key ${key}`);
    }
  }

  static formatLinkKey(alias: string): string {
    return `linkforge:link:alias:${alias}`;
  }
}
