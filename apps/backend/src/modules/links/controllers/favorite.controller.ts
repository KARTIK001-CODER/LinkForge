import { Request, Response } from 'express';
import { FavoriteService } from '../services/favorite.service';

const favoriteService = new FavoriteService();

export const favoriteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;
    
    const updatedLink = await favoriteService.toggleFavorite(id, true, userId);
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedLink.id,
        isFavorite: updatedLink.isFavorite
      },
    });
  } catch (error: any) {
    handleFavoriteError(error, res);
  }
};

export const unfavoriteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;
    
    const updatedLink = await favoriteService.toggleFavorite(id, false, userId);
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedLink.id,
        isFavorite: updatedLink.isFavorite
      },
    });
  } catch (error: any) {
    handleFavoriteError(error, res);
  }
};

function handleFavoriteError(error: any, res: Response) {
  if (error.name === 'NotFoundError') {
    res.status(404).json({
      success: false,
      message: 'Link not found',
    });
    return;
  }
  
  if (error.name === 'InvalidTransitionError') {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error('Error during favorite toggle:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
