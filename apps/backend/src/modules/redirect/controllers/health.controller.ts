import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import logger from '../../../lib/logger';
import { RedisCacheService } from '../services/redis-cache.service';

export class HealthController {
  static getHealth(req: Request, res: Response) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  static async getReadiness(req: Request, res: Response) {
    const checks: Record<string, string> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'connected';
    } catch {
      checks.database = 'disconnected';
    }

    try {
      const client = RedisCacheService.getClient();
      if (client) {
        await client.ping();
        checks.redis = 'connected';
      } else {
        checks.redis = 'not_configured';
      }
    } catch {
      checks.redis = 'disconnected';
    }

    const allConnected = Object.values(checks).every(v => v === 'connected' || v === 'not_configured');
    const status = allConnected ? 'ready' : 'not_ready';

    if (!allConnected) {
      logger.warn({ checks }, 'Readiness check failed');
    }

    res.status(allConnected ? 200 : 503).json({ status, ...checks });
  }
}
