import { Request, Response } from 'express';
import { AuthRepository } from '../repositories/auth.repository';
import { updateProfileSchema } from '../validators/auth.validator';
import { handleControllerError } from '../../../lib/error-handler';

const authRepo = new AuthRepository();

export class UserController {
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await authRepo.findById(userId);
      if (!user) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      }
      return res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      });
    } catch (error: unknown) {
      handleControllerError(res, error, 'User GetProfile');
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = updateProfileSchema.parse(req.body);

      if (data.username) {
        const existing = await authRepo.findByUsername(data.username);
        if (existing && existing.id !== userId) {
          return res.status(409).json({ error: { code: 'USERNAME_EXISTS', message: 'Username already taken' } });
        }
      }

      const updated = await authRepo.updateUser(userId, data);
      return res.json({
        id: updated.id,
        email: updated.email,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        isVerified: updated.isVerified,
        avatarUrl: updated.avatarUrl,
      });
    } catch (error: unknown) {
      handleControllerError(res, error, 'User UpdateProfile');
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await authRepo.findById(userId);
      if (!user) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      }
      return res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      });
    } catch (error: unknown) {
      handleControllerError(res, error, 'User GetMe');
    }
  }
}
