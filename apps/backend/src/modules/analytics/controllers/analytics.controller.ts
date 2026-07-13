import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { z } from 'zod';

const analyticsService = new AnalyticsService();

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
}
