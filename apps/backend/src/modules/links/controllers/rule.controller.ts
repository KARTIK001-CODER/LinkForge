import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { RedisCacheService } from '../../redirect/services/redis-cache.service';

export class RuleController {
  static async getRules(req: Request, res: Response) {
    try {
      const linkId = req.params.id;
      const userId = (req as any).user?.id;
      
      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) return res.status(404).json({ status: 'error', message: 'Link not found' });

      const rules = await prisma.redirectRule.findMany({
        where: { linkId },
        orderBy: { priority: 'asc' }
      });
      return res.json({ status: 'success', data: rules });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to fetch rules' });
    }
  }

  static async createRule(req: Request, res: Response) {
    try {
      const linkId = req.params.id;
      const userId = (req as any).user?.id;
      const { priority, destinationUrl, conditions } = req.body;
      
      const link = await prisma.smartLink.findFirst({ where: { id: linkId, userId } });
      if (!link) return res.status(404).json({ status: 'error', message: 'Link not found' });

      const rule = await prisma.redirectRule.create({
        data: {
          linkId,
          priority,
          destinationUrl,
          conditions
        }
      });

      // Purge cache
      if (link?.alias) {
        Promise.resolve().then(() => RedisCacheService.delete(RedisCacheService.formatLinkKey(link.alias!)));
      }

      return res.status(201).json({ status: 'success', data: rule });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to create rule' });
    }
  }

  static async deleteRule(req: Request, res: Response) {
    try {
      const { ruleId } = req.params;
      const userId = (req as any).user?.id;
      
      const rule = await prisma.redirectRule.findUnique({ where: { id: ruleId }, include: { link: true } });
      if (!rule || rule.link?.userId !== userId) {
        return res.status(404).json({ status: 'error', message: 'Rule not found' });
      }
      
      await prisma.redirectRule.delete({ where: { id: ruleId } });
      
      // Purge cache
      if (rule?.link?.alias) {
        Promise.resolve().then(() => RedisCacheService.delete(RedisCacheService.formatLinkKey(rule.link.alias)));
      }
      
      return res.json({ status: 'success' });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to delete rule' });
    }
  }
}
