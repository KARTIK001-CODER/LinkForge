import { Request, Response } from 'express';
import { AuthService, AppError } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import { z } from 'zod';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.register(data, ipAddress, userAgent);

      CookieService.setRefreshCookie(res, result.tokens.refreshToken, 30);
      return res.status(201).json({
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      console.error('[Auth] Register error:', error);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(data, ipAddress, userAgent);

      const maxAgeDays = data.rememberMe ? 90 : 30;
      CookieService.setRefreshCookie(res, result.tokens.refreshToken, maxAgeDays);
      return res.json({
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      console.error('[Auth] Login error:', error);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.linkforge_refresh_token || req.body?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'No refresh token provided' } });
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.refresh(refreshToken, ipAddress, userAgent);

      CookieService.setRefreshCookie(res, result.tokens.refreshToken, 30);
      return res.json({
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        CookieService.clearRefreshCookie(res);
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      console.error('[Auth] Refresh error:', error);
      CookieService.clearRefreshCookie(res);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.linkforge_refresh_token;
      await authService.logout(refreshToken);
      CookieService.clearRefreshCookie(res);
      return res.json({ message: 'Logged out successfully' });
    } catch {
      CookieService.clearRefreshCookie(res);
      return res.json({ message: 'Logged out successfully' });
    }
  }

  static async logoutAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (userId) {
        await authService.logoutAll(userId);
      }
      CookieService.clearRefreshCookie(res);
      return res.json({ message: 'Logged out from all devices' });
    } catch (error: any) {
      console.error('[Auth] Logout all error:', error);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async getSessions(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const refreshToken = req.cookies?.linkforge_refresh_token;
      const sessions = await authService.getSessions(userId, refreshToken);
      return res.json({ sessions });
    } catch (error: any) {
      console.error('[Auth] Get sessions error:', error);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async revokeSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const sessionId = String(req.params.sessionId);
      await authService.revokeSession(userId, sessionId);
      return res.json({ message: 'Session revoked' });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(data.email);
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data.token, data.password);
      return res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const data = changePasswordSchema.parse(req.body);
      const userId = req.user!.userId;
      await authService.changePassword(userId, data.currentPassword, data.newPassword);
      return res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const token = String(req.query.token || req.body?.token || '');
      if (!token) {
        return res.status(400).json({ error: { code: 'NO_TOKEN', message: 'Verification token required' } });
      }
      await authService.verifyEmail(token);
      return res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }

  static async resendVerification(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      await authService.resendVerificationEmail(userId);
      return res.json({ message: 'Verification email sent' });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
}
