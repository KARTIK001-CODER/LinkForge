import { Request, Response } from 'express';
import { LifecycleService } from '../services/lifecycle.service';
import { handleControllerError } from '../../../lib/error-handler';

const lifecycleService = new LifecycleService();

export const archiveLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const archivedLink = await lifecycleService.archive(id, userId);

    res.status(200).json({
      status: 'success',
      data: archivedLink,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Archive Link');
  }
};

export const restoreLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const restoredLink = await lifecycleService.restore(id, userId);

    res.status(200).json({
      status: 'success',
      data: restoredLink,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Restore Link');
  }
};

export const deleteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    await lifecycleService.delete(id, userId);

    res.status(200).json({
      success: true,
      message: 'Link deleted successfully',
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Delete Link');
  }
};
