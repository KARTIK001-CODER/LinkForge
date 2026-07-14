import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import { handleControllerError } from '../../../lib/error-handler';

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
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth Register');
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
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth Login');
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
    } catch (error: unknown) {
      CookieService.clearRefreshCookie(res);
      handleControllerError(res, error, 'Auth Refresh');
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
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth LogoutAll');
    }
  }

  static async getSessions(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const refreshToken = req.cookies?.linkforge_refresh_token;
      const sessions = await authService.getSessions(userId, refreshToken);
      return res.json({ sessions });
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth GetSessions');
    }
  }

  static async revokeSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const sessionId = String(req.params.sessionId);
      await authService.revokeSession(userId, sessionId);
      return res.json({ message: 'Session revoked' });
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth RevokeSession');
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(data.email);
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: (error as any).issues });
      }
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data.token, data.password);
      return res.json({ message: 'Password reset successfully' });
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth ResetPassword');
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const data = changePasswordSchema.parse(req.body);
      const userId = req.user!.userId;
      await authService.changePassword(userId, data.currentPassword, data.newPassword);
      return res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth ChangePassword');
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
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth VerifyEmail');
    }
  }

  static async resendVerification(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      await authService.resendVerificationEmail(userId);
      return res.json({ message: 'Verification email sent' });
    } catch (error: unknown) {
      handleControllerError(res, error, 'Auth ResendVerification');
    }
  }
}
