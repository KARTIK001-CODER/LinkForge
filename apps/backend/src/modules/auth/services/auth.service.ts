import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { User } from '@prisma/client';
import { AuthRepository } from '../repositories/auth.repository';
import { JwtService } from './jwt.service';
import { EmailService } from './email.service';
import { AppError } from '../../../lib/app-error';
import type { AuthUser, AuthTokens, LoginResponse, SessionInfo } from '../models/auth.domain';
import type { RegisterDto, LoginDto } from '../validators/auth.validator';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export { AppError };

export class AuthService {
  private authRepo: AuthRepository;
  private emailService: EmailService;

  constructor() {
    this.authRepo = new AuthRepository();
    this.emailService = new EmailService();
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const existingEmail = await this.authRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new AppError('Email already registered', 'EMAIL_EXISTS', 409);
    }

    const existingUsername = await this.authRepo.findByUsername(dto.username);
    if (existingUsername) {
      throw new AppError('Username already taken', 'USERNAME_EXISTS', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const displayName = dto.displayName || dto.username;

    const user = await this.authRepo.createUser({
      email: dto.email.toLowerCase(),
      username: dto.username,
      displayName,
      passwordHash,
    });

    await this.authRepo.createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await this.authRepo.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return this.generateAuthResponse(user, false, ipAddress, userAgent);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const identifier = dto.email || dto.username;
    if (!identifier) {
      throw new AppError('Email or username is required', 'INVALID_INPUT', 400);
    }

    const user = dto.email
      ? await this.authRepo.findByEmail(identifier.toLowerCase())
      : await this.authRepo.findByUsername(identifier!);

    if (!user) {
      throw new AppError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 'ACCOUNT_INACTIVE', 403);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      throw new AppError(`Account locked. Try again in ${remaining} minutes`, 'ACCOUNT_LOCKED', 429);
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      await this.authRepo.incrementLoginAttempts(user.id);
      if (user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        await this.authRepo.lockUser(user.id, LOCK_DURATION_MINUTES);
        await this.authRepo.createAuditLog({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          resource: 'user',
          resourceId: user.id,
          details: { reason: 'Max login attempts exceeded' },
          ipAddress,
          userAgent,
        });
      }
      throw new AppError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    await this.authRepo.resetLoginAttempts(user.id);
    await this.authRepo.updateUser(user.id, { lastLoginAt: new Date() });

    await this.authRepo.createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return this.generateAuthResponse(user, dto.rememberMe || false, ipAddress, userAgent);
  }

  async refresh(refreshTokenStr: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const payload = JwtService.verifyRefreshToken(refreshTokenStr);
    if (!payload) {
      throw new AppError('Invalid refresh token', 'INVALID_TOKEN', 401);
    }

    const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    const storedToken = await this.authRepo.findRefreshToken(tokenHash);
    if (!storedToken || storedToken.revokedAt) {
      throw new AppError('Refresh token revoked or not found', 'INVALID_TOKEN', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token expired', 'TOKEN_EXPIRED', 401);
    }

    await this.authRepo.revokeRefreshToken(storedToken.id);

    const user = await this.authRepo.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 'USER_INACTIVE', 401);
    }

    await this.authRepo.createAuditLog({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return this.generateAuthResponse(user, false, ipAddress, userAgent);
  }

  async logout(refreshTokenStr: string): Promise<void> {
    if (!refreshTokenStr) return;
    const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    const storedToken = await this.authRepo.findRefreshToken(tokenHash);
    if (storedToken && !storedToken.revokedAt) {
      await this.authRepo.revokeRefreshToken(storedToken.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepo.revokeAllUserRefreshTokens(userId);
  }

  async getSessions(userId: string, currentRefreshToken?: string): Promise<SessionInfo[]> {
    const sessions = await this.authRepo.listActiveSessions(userId);
    const currentTokenHash = currentRefreshToken
      ? crypto.createHash('sha256').update(currentRefreshToken).digest('hex')
      : undefined;

    return sessions.map(s => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.tokenHash === currentTokenHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.authRepo.findRefreshToken(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError('Session not found', 'NOT_FOUND', 404);
    }
    await this.authRepo.revokeRefreshToken(sessionId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepo.findByEmail(email.toLowerCase());
    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.authRepo.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await this.authRepo.findPasswordResetToken(tokenHash);
    if (!stored || stored.usedAt) {
      throw new AppError('Invalid or used reset token', 'INVALID_TOKEN', 400);
    }
    if (stored.expiresAt < new Date()) {
      throw new AppError('Reset token expired', 'TOKEN_EXPIRED', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.authRepo.updateUser(stored.userId, { passwordHash });
    await this.authRepo.usePasswordResetToken(stored.id);
    await this.authRepo.revokeAllUserRefreshTokens(stored.userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.authRepo.updateUser(userId, { passwordHash });
    await this.authRepo.revokeAllUserRefreshTokens(userId);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await this.authRepo.findEmailVerificationToken(tokenHash);
    if (!stored || stored.usedAt) {
      throw new AppError('Invalid or used verification token', 'INVALID_TOKEN', 400);
    }
    if (stored.expiresAt < new Date()) {
      throw new AppError('Verification token expired', 'TOKEN_EXPIRED', 400);
    }

    await this.authRepo.updateUser(stored.userId, { isVerified: true });
    await this.authRepo.useEmailVerificationToken(stored.id);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }
    if (user.isVerified) {
      throw new AppError('Email already verified', 'ALREADY_VERIFIED', 400);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.authRepo.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await this.emailService.sendVerificationEmail(user.email, token);
  }

  private async generateAuthResponse(
    user: User,
    rememberMe: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    const tokenId = crypto.randomUUID();
    const refreshTokenRaw = rememberMe
      ? JwtService.signRefreshTokenLong({ userId: user.id, tokenId })
      : JwtService.signRefreshToken({ userId: user.id, tokenId });

    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const expiryDays = JwtService.getRefreshTokenExpiryDays(rememberMe);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    await this.authRepo.createRefreshToken({
      userId: user.id,
      tokenHash,
      deviceInfo: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
    });

    const accessToken = JwtService.signAccessToken({ userId: user.id, role: user.role });
    const expiresIn = JwtService.getAccessTokenExpirySeconds();

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role as 'USER' | 'ADMIN',
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken: refreshTokenRaw,
        expiresIn,
      },
    };
  }
}
