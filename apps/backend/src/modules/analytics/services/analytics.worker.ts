import Redis from 'ioredis';
import crypto from 'crypto';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { VisitorService } from './visitor.service';
import { SessionService } from './session.service';
import { EnrichmentService } from './enrichment.service';
import { AnalyticsCache } from './analytics.cache';
import { RawAnalyticsEvent, EnrichedAnalyticsEvent, EventDedupKey } from '../models/analytics.domain';

const CONCURRENCY = 10;
const BATCH_SIZE = 50;
const DEDUP_TTL = 86400;

interface QueuedEvent {
  event: RawAnalyticsEvent;
  messageId: string;
}

export class AnalyticsWorker {
  private redis: Redis | null = null;
  private readonly STREAM_KEY = 'analytics:events';
  private readonly GROUP_NAME = 'analytics_workers';
  private readonly CONSUMER_NAME = `worker-${process.pid}-${Date.now()}`;
  private readonly DLQ_KEY = 'analytics:dead-letter';
  private readonly DEDUP_PREFIX = 'analytics:dedup:';
  private readonly MAX_RETRIES = 3;
  private isRunning = false;

  private analyticsRepo: AnalyticsRepository;
  private visitorService: VisitorService;
  private sessionService: SessionService;
  private enrichmentService: EnrichmentService;
  private analyticsCache: AnalyticsCache;

  constructor() {
    this.analyticsRepo = new AnalyticsRepository();
    this.visitorService = new VisitorService(this.analyticsRepo);
    this.sessionService = new SessionService(this.analyticsRepo);
    this.enrichmentService = new EnrichmentService();
    this.analyticsCache = new AnalyticsCache();

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null, enableOfflineQueue: true });
      this.redis.on('error', (err: any) => {
        if (err.message?.includes('ECONNREFUSED')) return;
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
        'COUNT', BATCH_SIZE,
        'BLOCK', 5000,
        'STREAMS', this.STREAM_KEY, '>'
      );

      if (stream && stream.length > 0) {
        const streamEntry = stream[0] as [string, [string, string[]][]];
        const messages = streamEntry[1];
        const batch: QueuedEvent[] = [];

        for (const [messageId, fields] of messages) {
          const payloadIdx = fields.indexOf('payload');
          if (payloadIdx !== -1) {
            try {
              const event: RawAnalyticsEvent = JSON.parse(fields[payloadIdx + 1]);
              event.timestamp = new Date(event.timestamp);
              batch.push({ event, messageId });
            } catch (err: any) {
              console.error(`[AnalyticsWorker] Invalid JSON in message ${messageId}:`, err.message);
              await this.redis.xack(this.STREAM_KEY, this.GROUP_NAME, messageId);
            }
          }
        }

        if (batch.length > 0) {
          const chunks = this.chunk(batch, CONCURRENCY);
          await Promise.all(chunks.map(chunk => this.processBatch(chunk)));
        }
      }
    } catch (e: any) {
      if (!e.message?.includes('NOGROUP')) {
        console.error('[AnalyticsWorker] Poll error', e.message);
      }
    }

    if (this.isRunning) {
      setImmediate(() => this.poll());
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private async processBatch(batch: QueuedEvent[]) {
    if (!this.redis) return;

    const enriched: EnrichedAnalyticsEvent[] = [];
    const ackIds: string[] = [];
    const failed: QueuedEvent[] = [];

    for (const { event, messageId } of batch) {
      try {
        const dedupKey = this.buildDedupKey(event);
        const exists = await this.redis.get(dedupKey);
        if (exists) {
          await this.redis.xack(this.STREAM_KEY, this.GROUP_NAME, messageId);
          continue;
        }

        const { visitorId, ipHash } = await this.visitorService.processVisitor(event.ip, event.userAgent);
        const sessionId = await this.sessionService.trackSession(visitorId, event.linkId);
        const enrichedData = this.enrichmentService.enrichEvent(
          event.ip,
          event.userAgent,
          event.originalUrl,
          undefined
        );

        enriched.push({
          ...event,
          ...enrichedData,
          visitorId,
          sessionId,
          ipHash,
        });
        ackIds.push(messageId);

        await this.redis.setex(dedupKey, DEDUP_TTL, '1');
      } catch (error: any) {
        failed.push({ event, messageId });
      }
    }

    if (enriched.length > 0) {
      try {
        const firstVisitByDay = new Map<string, { linkId: string; visitorId: string; timestamp: Date }>();
        const linkClicksSet = new Set<string>();
        const aggUpdates: { linkId: string; dimension: string; value: string }[] = [];

        for (const e of enriched) {
          const dayKey = `${e.linkId}:${e.visitorId}:${e.timestamp.toISOString().slice(0, 10)}`;
          if (!firstVisitByDay.has(dayKey)) {
            firstVisitByDay.set(dayKey, { linkId: e.linkId, visitorId: e.visitorId, timestamp: e.timestamp });
          }
          linkClicksSet.add(e.linkId);

          if (e.country && e.country !== 'Unknown') aggUpdates.push({ linkId: e.linkId, dimension: 'country', value: e.country });
          if (e.browser && e.browser !== 'Unknown') aggUpdates.push({ linkId: e.linkId, dimension: 'browser', value: e.browser });
          if (e.os && e.os !== 'Unknown') aggUpdates.push({ linkId: e.linkId, dimension: 'os', value: e.os });
          if (e.deviceType) aggUpdates.push({ linkId: e.linkId, dimension: 'deviceType', value: e.deviceType });
          if (e.referrer) aggUpdates.push({ linkId: e.linkId, dimension: 'referrer', value: e.referrer });
        }

        await this.analyticsRepo.batchCreateAnalyticsEvents(enriched);

        for (const linkId of linkClicksSet) {
          await this.analyticsRepo.incrementLinkClicks(linkId);
        }

        const processedDays = new Set<string>();
        for (const e of enriched) {
          const dayKey = `${e.linkId}:${e.visitorId}:${e.timestamp.toISOString().slice(0, 10)}`;
          if (processedDays.has(dayKey)) {
            await this.analyticsRepo.updateDailyMetrics(e.linkId, e.timestamp, e.visitorId, false);
            await this.analyticsRepo.updateHourlyMetrics(e.linkId, e.timestamp, e.visitorId, false);
          } else {
            processedDays.add(dayKey);
            await this.analyticsRepo.updateDailyMetrics(e.linkId, e.timestamp, e.visitorId, true);
            await this.analyticsRepo.updateHourlyMetrics(e.linkId, e.timestamp, e.visitorId, true);
          }
        }

        if (aggUpdates.length > 0) {
          const uniqueAggs = new Map<string, { linkId: string; dimension: string; value: string }>();
          for (const agg of aggUpdates) {
            const key = `${agg.linkId}:${agg.dimension}:${agg.value}`;
            uniqueAggs.set(key, agg);
          }
          const p10 = Math.ceil(aggUpdates.length / 10);
          const aggChunks = this.chunk([...uniqueAggs.values()], p10);
          for (const chunk of aggChunks) {
            await Promise.all(chunk.map(a => this.analyticsRepo.updateAggregatedMetric(a.linkId, a.dimension, a.value)));
          }
        }

        for (const msgId of ackIds) {
          await this.redis!.xack(this.STREAM_KEY, this.GROUP_NAME, msgId);
        }

        const linkIds = [...new Set(enriched.map(e => e.linkId))];
        for (const lid of linkIds) {
          this.analyticsCache.invalidateLinkCache(lid);
        }

        await this.redis.publish('analytics:events:processed', JSON.stringify({
          linkIds,
          count: enriched.length,
          timestamp: new Date().toISOString(),
        }));
      } catch (error: any) {
        console.error(`[AnalyticsWorker] Batch DB Error:`, error.message);
        for (const qe of batch) {
          await this.handleRetry(qe.event, qe.messageId, error);
        }
      }
    }

    for (const qe of failed) {
      await this.handleRetry(qe.event, qe.messageId, new Error('Processing failed'));
    }
  }

  private async handleRetry(event: RawAnalyticsEvent, messageId: string, error: Error) {
    if (!this.redis) return;

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
    } catch (e: any) {
      if (!e.message.includes('NOGROUP')) {
        console.error('[AnalyticsWorker] Error claiming pending messages:', e.message);
      }
    }
  }

  private buildDedupKey(event: RawAnalyticsEvent): string {
    const hour = new Date(event.timestamp).toISOString().slice(0, 13);
    const hash = `${event.linkId}-${event.ip}-${event.userAgent}-${hour}`;
    return `${this.DEDUP_PREFIX}${crypto.createHash('md5').update(hash).digest('hex')}`;
  }
}
