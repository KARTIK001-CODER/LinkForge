import { Request, Response } from 'express';
import { editLinkSchema } from '../validators/editLink.schema';
import { EditLinkService } from '../services/editLink.service';
import { z } from 'zod';

export const editLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // In a real app, verify user owns this link using req.user (IDOR protection)
    
    const data = editLinkSchema.parse(req.body);
    const service = new EditLinkService();
    
    const updatedLink = await service.execute(id, data);
    
    res.status(200).json({
      status: 'success',
      data: updatedLink,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: (error as any).errors,
      });
      return;
    }
    
    if (error.name === 'NotFoundError') {
      res.status(404).json({
        status: 'error',
        message: 'Link not found',
      });
      return;
    }

    console.error('Error editing link:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
