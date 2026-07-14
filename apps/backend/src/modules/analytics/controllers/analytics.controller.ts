import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ExportService } from '../services/export.service';
import { AnalyticsCache } from '../services/analytics.cache';
import { z } from 'zod';
import prisma from '../../../lib/prisma';

const analyticsService = new AnalyticsService();
const exportService = new ExportService();
const analyticsCache = new AnalyticsCache();

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class AnalyticsController {

  static async getSummary(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) return res.status(404).json({ error: 'Link not found' });

      const query = querySchema.parse(req.query);
      const endDate = query.endDate ? new Date(query.endDate) : undefined;
      const startDate = query.startDate ? new Date(query.startDate) : undefined;

      const summary = await analyticsService.getSummary(linkId, userId, startDate, endDate);
      res.set('Cache-Control', 'public, max-age=15, s-maxage=30');
      return res.json(summary);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error('[Analytics] getSummary error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getTimeseries(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) return res.status(404).json({ error: 'Link not found' });

      const schema = z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      });

      const query = schema.parse(req.query);
      const endDate = query.endDate ? new Date(query.endDate) : new Date();
      const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const timeseries = await analyticsService.getTimeseries(linkId, startDate, endDate);
      res.set('Cache-Control', 'public, max-age=15, s-maxage=30');
      return res.json({ data: timeseries });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error('[Analytics] getTimeseries error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getBreakdown(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) return res.status(404).json({ error: 'Link not found' });

      const { dimension, startDate, endDate } = req.query;
      if (!dimension) {
        return res.status(400).json({ error: 'dimension is required' });
      }

      const parsedStart = startDate ? new Date(String(startDate)) : undefined;
      const parsedEnd = endDate ? new Date(String(endDate)) : undefined;

      const breakdown = await analyticsService.getBreakdown(
        linkId,
        String(dimension) as any,
        parsedStart,
        parsedEnd
      );
      res.set('Cache-Control', 'public, max-age=30, s-maxage=60');
      return res.json({ dimension, data: breakdown });
    } catch (error: any) {
      console.error('[Analytics] getBreakdown error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getRealtime(req: Request, res: Response) {
    const linkId = String(req.params.linkId);
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
    if (!link) return res.status(404).json({ error: 'Link not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const redis = new AnalyticsCache();
    let lastEventId = 0;

    const sendRecentActivity = async () => {
      try {
        const events = await prisma.analyticsEvent.findMany({
          where: { linkId },
          orderBy: { timestamp: 'desc' },
          take: 5,
          select: {
            id: true,
            timestamp: true,
            country: true,
            browser: true,
            deviceType: true,
            referrer: true,
          },
        });
        if (events.length > 0) {
          res.write(`data: ${JSON.stringify({ type: 'recent', events })}\n\n`);
        }
      } catch {}
    };

    const sendSummary = async () => {
      try {
        const summary = await analyticsService.getSummary(linkId, userId);
        res.write(`data: ${JSON.stringify({ type: 'summary', ...summary })}\n\n`);
      } catch {}
    };

    const sendPing = () => {
      lastEventId++;
      res.write(`id: ${lastEventId}\ndata: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
    };

    const summaryInterval = setInterval(sendSummary, 10000);
    const activityInterval = setInterval(sendRecentActivity, 15000);
    const pingInterval = setInterval(sendPing, 30000);

    sendSummary();
    sendRecentActivity();

    req.on('close', () => {
      clearInterval(summaryInterval);
      clearInterval(activityInterval);
      clearInterval(pingInterval);
      res.end();
    });
  }

  static async requestExport(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) return res.status(404).json({ error: 'Link not found' });

      const jobId = await exportService.createExportJob(linkId);
      return res.json({ jobId, message: 'Export job created successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getExportStatus(req: Request, res: Response) {
    try {
      const jobId = String(req.params.jobId);
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const job = await exportService.getExportJob(jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });

      if (job.linkId) {
        const link = await prisma.smartLink.findFirst({ where: { id: job.linkId, userId } });
        if (!link) return res.status(404).json({ error: 'Link not found' });
      }

      res.set('Cache-Control', 'no-cache');
      return res.json(job);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getDiagnostics(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not available in production' });
    }

    try {
      const metrics = await analyticsCache.getWorkerMetrics();
      const cacheStats = await analyticsCache.getCacheHitRate();

      const eventCount = await prisma.analyticsEvent.count();
      const visitorCount = await prisma.visitor.count();
      const sessionCount = await prisma.visitorSession.count();

      const recentEvents = await prisma.analyticsEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: { id: true, linkId: true, alias: true, timestamp: true, country: true, browser: true, deviceType: true },
      });

      let queueSize = 0;
      const redis = AnalyticsCache.getClient();
      if (redis) {
        try {
          queueSize = await redis.xlen('analytics:events');
        } catch {}
      }

      let dbLatency = 0;
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;

      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        events: {
          total: eventCount,
          recent: recentEvents,
        },
        visitors: {
          total: visitorCount,
        },
        sessions: {
          total: sessionCount,
        },
        queue: {
          size: queueSize,
          streamKey: 'analytics:events',
          consumerGroup: 'analytics_workers',
        },
        cache: cacheStats,
        workers: metrics,
        latency: {
          db: dbLatency,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
