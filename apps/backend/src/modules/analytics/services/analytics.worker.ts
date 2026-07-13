import Redis from 'ioredis';
import { RawAnalyticsEvent } from '../models/analytics.domain';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';

const prisma = new PrismaClient();

export class AnalyticsWorker {
  private redis: Redis | null = null;
  private readonly STREAM_KEY = 'analytics:events';
  private readonly GROUP_NAME = 'analytics_workers';
  private readonly CONSUMER_NAME = `worker-${process.pid}`;
  private isRunning = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
    } else {
      console.warn('[AnalyticsWorker] REDIS_URL not set. Worker disabled.');
    }
  }

  async start() {
    if (!this.redis) return;
    this.isRunning = true;

    // Create consumer group if it doesn't exist
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
      // Read 100 events at a time, block for 5000ms if empty
      const stream = await this.redis.xreadgroup(
        'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
        'COUNT', 100,
        'BLOCK', 5000,
        'STREAMS', this.STREAM_KEY, '>'
      );

      if (stream && stream.length > 0) {
        const [, messages] = stream[0];
        
        for (const message of messages) {
          const [messageId, fields] = message;
          const payloadIdx = fields.indexOf('payload');
          
          if (payloadIdx !== -1) {
            const payloadStr = fields[payloadIdx + 1];
            try {
              const event: RawAnalyticsEvent = JSON.parse(payloadStr);
              await this.processEvent(event);
            } catch (err) {
              console.error(`[AnalyticsWorker] Error processing message ${messageId}`, err);
            }
          }
          
          // Acknowledge message
          await this.redis.xack(this.STREAM_KEY, this.GROUP_NAME, messageId);
        }
      }
    } catch (e: any) {
      console.error('[AnalyticsWorker] Poll error', e);
    }

    // Schedule next poll
    if (this.isRunning) {
      setImmediate(() => this.poll());
    }
  }

  private async processEvent(event: RawAnalyticsEvent) {
    // 1. Generate Anonymous Visitor ID
    const today = new Date().toISOString().split('T')[0];
    const salt = process.env.ANALYTICS_SALT || 'default-salt';
    const hashInput = `${event.ip}-${event.userAgent}-${today}-${salt}`;
    const visitorHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // 2. GeoIP Enrichment
    const geo = geoip.lookup(event.ip);
    const country = geo?.country || 'Unknown';
    const city = geo?.city || 'Unknown';

    // 3. User-Agent Enrichment
    const parser = new UAParser(event.userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    
    // Device detection based on UA
    const deviceType = parser.getDevice().type || 'Desktop'; 

    // 4. UTM Parsing
    let utmSource, utmMedium, utmCampaign;
    if (event.originalUrl) {
      try {
        const url = new URL(event.originalUrl, 'http://localhost');
        utmSource = url.searchParams.get('utm_source') || undefined;
        utmMedium = url.searchParams.get('utm_medium') || undefined;
        utmCampaign = url.searchParams.get('utm_campaign') || undefined;
      } catch (e) {}
    }

    // 5. Database Persistence
    try {
      // Create or find visitor
      const visitor = await prisma.visitor.upsert({
        where: { hash: visitorHash },
        update: {},
        create: { hash: visitorHash },
      });

      // Update Session logic (simplified for Epic 3: 1 session per visitor per link per day)
      // Actually we just record the event and create a session if it doesn't exist
      const session = await prisma.visitorSession.findFirst({
        where: { visitorId: visitor.id, linkId: event.linkId },
      });

      if (!session) {
        await prisma.visitorSession.create({
          data: {
            visitorId: visitor.id,
            linkId: event.linkId,
          }
        });
      }

      // Record Analytics Event
      await prisma.analyticsEvent.create({
        data: {
          linkId: event.linkId,
          visitorId: visitor.id,
          timestamp: new Date(event.timestamp),
          country,
          city,
          browser,
          os,
          deviceType,
          referrer: event.referrer,
          utmSource,
          utmMedium,
          utmCampaign,
        }
      });
      
    } catch (dbError) {
      console.error('[AnalyticsWorker] DB Error:', dbError);
      throw dbError; // Bubble up so message is not acked if we care, or swallow to move on. We swallow in processEvent caller.
    }
  }
}
