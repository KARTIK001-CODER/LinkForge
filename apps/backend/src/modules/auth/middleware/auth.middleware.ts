import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwt.service';
import { AuthRepository } from '../repositories/auth.repository';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export class AuthMiddleware {
  private static authRepo = new AuthRepository();

  static requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const payload = JwtService.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    req.user = { userId: payload.userId, role: payload.role };
    next();
  }

  static optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = JwtService.verifyAccessToken(token);
      if (payload) {
        req.user = { userId: payload.userId, role: payload.role };
      }
    }
    next();
  }
}
