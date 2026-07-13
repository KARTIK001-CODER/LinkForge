import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ExportService } from '../services/export.service';
import { z } from 'zod';

const analyticsService = new AnalyticsService();
const exportService = new ExportService();

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class AnalyticsController {

  static async getSummary(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const workspaceId = 'todo-auth-context';
      const query = querySchema.parse(req.query);

      const endDate = query.endDate ? new Date(query.endDate) : undefined;
      const startDate = query.startDate ? new Date(query.startDate) : undefined;

      const summary = await analyticsService.getSummary(linkId, workspaceId, startDate, endDate);
      res.set('Cache-Control', 'public, max-age=30, s-maxage=60');
      return res.json(summary);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getTimeseries(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);

      const schema = z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
      });

      const query = schema.parse(req.query);

      const endDate = query.endDate ? new Date(query.endDate) : new Date();
      const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const timeseries = await analyticsService.getTimeseries(linkId, startDate, endDate);
      res.set('Cache-Control', 'public, max-age=30, s-maxage=60');
      return res.json({ data: timeseries });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getBreakdown(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const { dimension } = req.query;

      if (!dimension) {
        return res.status(400).json({ error: 'dimension is required' });
      }

      const breakdown = await analyticsService.getBreakdown(linkId, String(dimension) as any);
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
      return res.json({ dimension, data: breakdown });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getRealtime(req: Request, res: Response) {
    const linkId = String(req.params.linkId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const interval = setInterval(() => {
      const data = JSON.stringify({ type: 'ping', timestamp: new Date().toISOString(), linkId });
      res.write(`data: ${data}\n\n`);
    }, 5000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  }

  static async requestExport(req: Request, res: Response) {
    try {
      const linkId = String(req.params.linkId);
      const jobId = await exportService.createExportJob(linkId);
      return res.json({ jobId, message: 'Export job created successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getExportStatus(req: Request, res: Response) {
    try {
      const jobId = String(req.params.jobId);
      const job = await exportService.getExportJob(jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      res.set('Cache-Control', 'no-cache');
      return res.json(job);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
