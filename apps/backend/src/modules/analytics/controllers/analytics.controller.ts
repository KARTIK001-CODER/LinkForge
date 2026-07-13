import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ExportService } from '../services/export.service';
import { z } from 'zod';

const analyticsService = new AnalyticsService();
const exportService = new ExportService();

export class AnalyticsController {
  
  static async getSummary(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const workspaceId = 'todo-auth-context'; // Mock for now

      const summary = await analyticsService.getSummary(linkId, workspaceId);
      return res.json(summary);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getTimeseries(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      
      const schema = z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
      });

      const query = schema.parse(req.query);
      
      // Default to last 30 days
      const endDate = query.endDate ? new Date(query.endDate) : new Date();
      const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const timeseries = await analyticsService.getTimeseries(linkId, startDate, endDate);
      return res.json({ data: timeseries });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getBreakdown(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const { dimension } = req.query;

      if (!dimension) {
        return res.status(400).json({ error: 'dimension is required' });
      }

      const breakdown = await analyticsService.getBreakdown(linkId, dimension as any);
      return res.json({ dimension, data: breakdown });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getRealtime(req: Request, res: Response) {
    const { linkId } = req.params;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Mock real-time pings
    const interval = setInterval(() => {
      const data = JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() });
      res.write(`data: ${data}\n\n`);
    }, 5000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  }

  static async requestExport(req: Request, res: Response) {
    try {
      const { linkId } = req.params;
      const jobId = await exportService.createExportJob(linkId);
      return res.json({ jobId, message: 'Export job created successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getExportStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await exportService.getExportJob(jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      return res.json(job);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
