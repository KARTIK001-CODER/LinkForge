import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { RedisCacheService } from '../../redirect/services/redis-cache.service';

export class RuleController {
  static async getRules(req: Request, res: Response) {
    try {
      const linkId = String(req.params.id);
      const userId = req.user?.userId;

      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) {
        return res.status(404).json({ status: 'error', message: 'Link not found' });
      }

      const rules = await prisma.redirectRule.findMany({
        where: { linkId },
        orderBy: { priority: 'asc' },
      });
      return res.json({ status: 'success', data: rules });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Failed to fetch rules' });
    }
  }

  static async createRule(req: Request, res: Response) {
    try {
      const linkId = String(req.params.id);
      const userId = req.user?.userId;
      const { priority, destinationUrl, conditions } = req.body;

      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) {
        return res.status(404).json({ status: 'error', message: 'Link not found' });
      }

      const rule = await prisma.redirectRule.create({
        data: {
          linkId,
          priority,
          destinationUrl,
          conditions,
        },
      });

      if (link.alias) {
        RedisCacheService.delete(RedisCacheService.formatLinkKey(link.alias)).catch(() => {});
      }

      return res.status(201).json({ status: 'success', data: rule });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Failed to create rule' });
    }
  }

  static async deleteRule(req: Request, res: Response) {
    try {
      const ruleId = String(req.params.ruleId);
      const userId = req.user?.userId;

      const rule = await prisma.redirectRule.findUnique({
        where: { id: ruleId },
        include: { link: { select: { alias: true, userId: true } } },
      });

      if (!rule || rule.link?.userId !== userId) {
        return res.status(404).json({ status: 'error', message: 'Rule not found' });
      }

      await prisma.redirectRule.delete({ where: { id: ruleId } });

      if (rule.link?.alias) {
        RedisCacheService.delete(RedisCacheService.formatLinkKey(rule.link.alias)).catch(() => {});
      }

      return res.json({ status: 'success' });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Failed to delete rule' });
    }
  }
}
