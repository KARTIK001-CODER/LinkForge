import { Request, Response } from 'express';
import { CreateLinkService } from '../services/createLink.service';
import { createLinkSchema } from '../validators/createLink.schema';
import { AliasConflictError } from '../models/link.domain';
import { handleControllerError } from '../../../lib/error-handler';

const createLinkService = new CreateLinkService();

export const createLink = async (req: Request, res: Response) => {
  try {
    const data = createLinkSchema.parse(req.body);
    const link = await createLinkService.execute(data, req.user?.userId);

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
  } catch (error: unknown) {
    if (error instanceof AliasConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    handleControllerError(res, error, 'Create Link');
  }
};
