import { Request, Response } from 'express';
import { AuthRepository } from '../repositories/auth.repository';
import { AppError } from '../services/auth.service';
import { updateProfileSchema } from '../validators/auth.validator';
import { z } from 'zod';

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
    } catch {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
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
    } catch {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
}
