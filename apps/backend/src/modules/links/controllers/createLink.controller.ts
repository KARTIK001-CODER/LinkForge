import { Request, Response } from 'express';
import { CreateLinkService } from '../services/createLink.service';
import { createLinkSchema } from '../validators/createLink.schema';
import { AliasConflictError } from '../models/link.domain';
import { z } from 'zod';

const createLinkService = new CreateLinkService();

export const createLink = async (req: Request, res: Response) => {
  try {
    const data = createLinkSchema.parse(req.body);
    const link = await createLinkService.execute(data, (req as any).user?.id);

    res.status(201).json({
      success: true,
      data: {
        id: link.id,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:4000'}/${link.alias}`,
        alias: link.alias,
        destinationUrl: link.destinationUrl,
        hasPassword: !!link.passwordHash,
        expiresAt: link.expiresAt,
        tags: link.tags,
        status: link.status,
        createdAt: link.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: (error as any).errors });
      return;
    }
    if (error instanceof AliasConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
