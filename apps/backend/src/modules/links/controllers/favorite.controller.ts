import { Request, Response } from 'express';
import { FavoriteService } from '../services/favorite.service';
import { handleControllerError } from '../../../lib/error-handler';

const favoriteService = new FavoriteService();

export const favoriteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const updatedLink = await favoriteService.toggleFavorite(id, true, userId);

    res.status(200).json({
      success: true,
      data: {
        id: updatedLink.id,
        isFavorite: updatedLink.isFavorite,
      },
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Favorite Link');
  }
};

export const unfavoriteLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const updatedLink = await favoriteService.toggleFavorite(id, false, userId);

    res.status(200).json({
      success: true,
      data: {
        id: updatedLink.id,
        isFavorite: updatedLink.isFavorite,
      },
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Unfavorite Link');
  }
};
