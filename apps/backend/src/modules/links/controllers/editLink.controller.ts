import { Request, Response } from 'express';
import { editLinkSchema } from '../validators/editLink.schema';
import { EditLinkService } from '../services/editLink.service';
import { handleControllerError } from '../../../lib/error-handler';

export const editLink = async (req: Request, res: Response): Promise<void> => {
  try {
      const id = String(req.params.id);
    const userId = req.user?.userId;

    const data = editLinkSchema.parse(req.body);
    const service = new EditLinkService();

    const updatedLink = await service.execute(id, data, userId);

    res.status(200).json({
      status: 'success',
      data: updatedLink,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Edit Link');
  }
};
