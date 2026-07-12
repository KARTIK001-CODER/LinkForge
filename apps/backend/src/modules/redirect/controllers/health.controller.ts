import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

export class HealthController {
  // Liveness check (Is the pod running?)
  static getHealth(req: Request, res: Response) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Readiness check (Can the pod connect to DB?)
  static async getReadiness(req: Request, res: Response) {
    try {
      // Fast check to ensure DB pool is available
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready', database: 'connected' });
    } catch (e: any) {
      console.error(`[HealthCheck] Readiness failed: ${e.message}`);
      res.status(503).json({ status: 'not_ready', database: 'disconnected' });
    }
  }
}
