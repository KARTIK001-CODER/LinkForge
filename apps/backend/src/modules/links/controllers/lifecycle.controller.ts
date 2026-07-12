import { Request, Response } from 'express';
import { LifecycleService } from '../services/lifecycle.service';

const lifecycleService = new LifecycleService();

export const archiveLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // In a real app, verify user owns this link using req.user (IDOR protection)
    
    const archivedLink = await lifecycleService.archive(id);
    
    res.status(200).json({
      status: 'success',
      data: archivedLink,
    });
  } catch (error: any) {
    handleLifecycleError(error, res);
  }
};

export const restoreLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // In a real app, verify user owns this link using req.user (IDOR protection)
    
    const restoredLink = await lifecycleService.restore(id);
    
    res.status(200).json({
      status: 'success',
      data: restoredLink,
    });
  } catch (error: any) {
    handleLifecycleError(error, res);
  }
};

function handleLifecycleError(error: any, res: Response) {
  if (error.name === 'NotFoundError') {
    res.status(404).json({
      status: 'error',
      message: 'Link not found',
    });
    return;
  }
  
  if (error.name === 'InvalidTransitionError') {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
    return;
  }

  console.error('Error during lifecycle transition:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
