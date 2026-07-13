import Redis from 'ioredis';
import { RawAnalyticsEvent } from '../models/analytics.domain';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { VisitorService } from './visitor.service';
import { SessionService } from './session.service';
import { EnrichmentService } from './enrichment.service';

const CONCURRENCY = 10;

export class AnalyticsWorker {
  private redis: Redis | null = null;
  private readonly STREAM_KEY = 'analytics:events';
  private readonly GROUP_NAME = 'analytics_workers';
  private readonly CONSUMER_NAME = `worker-${process.pid}`;
  private readonly DLQ_KEY = 'analytics:dead-letter';
  private readonly MAX_RETRIES = 3;
  private isRunning = false;

  private analyticsRepo: AnalyticsRepository;
  private visitorService: VisitorService;
  private sessionService: SessionService;
  private enrichmentService: EnrichmentService;

  constructor() {
    this.analyticsRepo = new AnalyticsRepository();
    this.visitorService = new VisitorService(this.analyticsRepo);
    this.sessionService = new SessionService(this.analyticsRepo);
    this.enrichmentService = new EnrichmentService();

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
      this.redis.on('error', (err: any) => {
        if (err.message && err.message.includes('ECONNREFUSED')) return;
        if (err.name === 'AggregateError') return;
        if (err.code === 'ECONNREFUSED') return;
      });
    } else {
      console.warn('[AnalyticsWorker] REDIS_URL not set. Worker disabled.');
    }
  }

  async start() {
    if (!this.redis) return;
    this.isRunning = true;

    try {
      await this.redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
    } catch (e: any) {
      if (!e.message.includes('BUSYGROUP')) {
        console.error('[AnalyticsWorker] Error creating consumer group', e);
        return;
      }
    }

    console.log(`[AnalyticsWorker] Started consumer ${this.CONSUMER_NAME}`);
    this.poll();
  }

  stop() {
    this.isRunning = false;
  }

  private async poll() {
    if (!this.isRunning || !this.redis) return;

    try {
      await this.claimPending();

      const stream = await this.redis.xreadgroup(
        'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
        'COUNT', 100,
        'BLOCK', 5000,
        'STREAMS', this.STREAM_KEY, '>'
      );

      if (stream && stream.length > 0) {
        const streamEntry = stream[0] as [string, [string, string[]][]];
        const messages = streamEntry[1];

        const processor = async (): Promise<void> => {
          while (messages.length > 0) {
            const message = messages.shift();
            if (!message) break;
            const [messageId, fields] = message;
            const payloadIdx = fields.indexOf('payload');

            if (payloadIdx !== -1) {
              const payloadStr = fields[payloadIdx + 1];
              try {
                const event: RawAnalyticsEvent = JSON.parse(payloadStr);
                await this.processEvent(event, messageId);
              } catch (err: any) {
                console.error(`[AnalyticsWorker] Error processing message ${messageId}:`, err.message);
              }
            }
          }
        };

        const workers: Promise<void>[] = [];
        for (let i = 0; i < CONCURRENCY; i++) {
          workers.push(processor());
        }
        await Promise.all(workers);
      }
    } catch (e: any) {
      console.error('[AnalyticsWorker] Poll error', e.message);
    }

    if (this.isRunning) {
      setImmediate(() => this.poll());
    }
  }

  private async claimPending() {
    if (!this.redis) return;
    try {
      const result = await this.redis.xautoclaim(
        this.STREAM_KEY,
        this.GROUP_NAME,
        this.CONSUMER_NAME,
        60000,
        '0-0',
        'COUNT', 100
      );
      const claimed = (result as any)?.[1];
      if (Array.isArray(claimed) && claimed.length > 0) {
        console.log(`[AnalyticsWorker] Claimed ${claimed.length} pending messages`);
      }
    } catch (e: any) {
      if (!e.message.includes('NOGROUP')) {
        console.error('[AnalyticsWorker] Error claiming pending messages:', e.message);
      }
    }
  }

  private async processEvent(event: RawAnalyticsEvent, messageId: string) {
    if (!this.redis) return;

    try {
      const visitorId = await this.visitorService.processVisitor(event.ip, event.userAgent);
      await this.sessionService.trackSession(visitorId, event.linkId);
      const enrichedData = this.enrichmentService.enrichEvent(event.ip, event.userAgent, event.originalUrl);

      await this.analyticsRepo.createAnalyticsEvent({
        ...event,
        visitorId,
        ...enrichedData,
      });

      await this.analyticsRepo.incrementLinkClicks(event.linkId);

      await this.analyticsRepo.updateDailyMetrics(event.linkId, event.timestamp, visitorId);

      const aggUpdates = [];
      if (enrichedData.country) aggUpdates.push({ dimension: 'country', value: enrichedData.country });
      if (enrichedData.browser) aggUpdates.push({ dimension: 'browser', value: enrichedData.browser });
      if (enrichedData.os) aggUpdates.push({ dimension: 'os', value: enrichedData.os });
      if (enrichedData.deviceType) aggUpdates.push({ dimension: 'deviceType', value: enrichedData.deviceType });
      if (event.referrer) aggUpdates.push({ dimension: 'referrer', value: event.referrer });
      await Promise.all(
        aggUpdates.map(a => this.analyticsRepo.updateAggregatedMetric(event.linkId, a.dimension, a.value))
      );

      await this.redis.xack(this.STREAM_KEY, this.GROUP_NAME, messageId);
    } catch (error: any) {
      console.error(`[AnalyticsWorker] DB Error for message ${messageId}:`, error.message);

      const retriesKey = `analytics:retry:${messageId}`;
      const retryCount = await this.redis.get(retriesKey);
      const attempts = retryCount ? parseInt(retryCount, 10) : 0;

      if (attempts >= this.MAX_RETRIES) {
        await this.redis.xadd(this.DLQ_KEY, '*', 'messageId', messageId, 'payload', JSON.stringify(event), 'error', error.message);
        await this.redis.xack(this.STREAM_KEY, this.GROUP_NAME, messageId);
        await this.redis.del(retriesKey);
        console.error(`[AnalyticsWorker] Moved message ${messageId} to dead-letter queue after ${attempts} retries`);
      } else {
        await this.redis.setex(retriesKey, 3600, (attempts + 1).toString());
        console.warn(`[AnalyticsWorker] Will retry message ${messageId} (attempt ${attempts + 1}/${this.MAX_RETRIES})`);
      }
    }
  }
}
