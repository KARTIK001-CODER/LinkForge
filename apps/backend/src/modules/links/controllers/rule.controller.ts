import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RuleController {
  static async getRules(req: Request, res: Response) {
    try {
      const linkId = req.params.id;
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
      const { priority, destinationUrl, conditions } = req.body;
      
      const rule = await prisma.redirectRule.create({
        data: {
          linkId,
          priority,
          destinationUrl,
          conditions
        }
      });
      return res.status(201).json({ status: 'success', data: rule });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to create rule' });
    }
  }

  static async deleteRule(req: Request, res: Response) {
    try {
      const { ruleId } = req.params;
      await prisma.redirectRule.delete({ where: { id: ruleId } });
      return res.json({ status: 'success' });
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Failed to delete rule' });
    }
  }
}
