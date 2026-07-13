import { Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';

export class OwnershipMiddleware {
  static requireLinkOwnership(req: Request, res: Response, next: NextFunction) {
    const linkId = String(req.params.id || req.params.linkId);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    prisma.smartLink.findUnique({ where: { id: linkId }, select: { userId: true } })
      .then(link => {
        if (!link) {
          return res.status(404).json({ error: 'Link not found' });
        }
        if (link.userId !== userId && req.user?.role !== 'ADMIN') {
          return res.status(403).json({ error: 'You do not own this link' });
        }
        next();
      })
      .catch(() => res.status(500).json({ error: 'Internal server error' }));
  }

  static requireCollectionOwnership(req: Request, res: Response, next: NextFunction) {
    const collectionId = String(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    prisma.collection.findUnique({ where: { id: collectionId }, select: { userId: true } })
      .then(collection => {
        if (!collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        if (collection.userId !== userId && req.user?.role !== 'ADMIN') {
          return res.status(403).json({ error: 'You do not own this collection' });
        }
        next();
      })
      .catch(() => res.status(500).json({ error: 'Internal server error' }));
  }
}
