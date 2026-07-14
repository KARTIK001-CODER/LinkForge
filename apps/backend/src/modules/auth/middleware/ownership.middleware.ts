import { Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';

export class OwnershipMiddleware {
  static async requireLinkOwnership(req: Request, res: Response, next: NextFunction) {
    try {
      const linkId = String(req.params.id || req.params.linkId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const link = await prisma.smartLink.findUnique({
        where: { id: linkId },
        select: { userId: true },
      });

      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      if (link.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not own this link' });
      }

      next();
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async requireCollectionOwnership(req: Request, res: Response, next: NextFunction) {
    try {
      const collectionId = String(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: { userId: true },
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not own this collection' });
      }

      next();
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
