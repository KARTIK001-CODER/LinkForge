import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

export class MetricsController {
  static async getMetrics(req: Request, res: Response) {
    try {
      res.set('Content-Type', MetricsService.getContentType());
      const metrics = await MetricsService.getMetrics();
      res.end(metrics);
    } catch (e) {
      res.status(500).end(e);
    }
  }
}
