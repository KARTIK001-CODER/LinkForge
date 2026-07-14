import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { AppError } from '../../../lib/app-error';
import { AuthRepository } from '../repositories/auth.repository';
import { JwtService } from '../services/jwt.service';

vi.mock('../repositories/auth.repository');
vi.mock('../services/jwt.service');

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: any;

  const mockUser = () => ({
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    passwordHash: '$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Ql5q3p0sY7s8c9d0e1f2a3b4c5d6e7',
    role: 'USER',
    isVerified: true,
    isActive: true,
    avatarUrl: null,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
    mockRepo = vi.mocked(AuthRepository.prototype);
    vi.mocked(JwtService.verifyAccessToken).mockReturnValue({ userId: 'user-1', role: 'USER' });
    vi.mocked(JwtService.signAccessToken).mockReturnValue('access-token');
    vi.mocked(JwtService.signRefreshToken).mockReturnValue('refresh-token');
    vi.mocked(JwtService.signRefreshTokenLong).mockReturnValue('refresh-token-long');
    vi.mocked(JwtService.getRefreshTokenExpiryDays).mockReturnValue(30);
    vi.mocked(JwtService.getAccessTokenExpirySeconds).mockReturnValue(900);
  });

  describe('register', () => {
    it('should throw if email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUser());
      await expect(service.register({ email: 'test@example.com', username: 'newuser', password: 'Password123!' }))
        .rejects.toThrow(AppError);
    });

    it('should throw if username already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(mockUser());
      await expect(service.register({ email: 'new@example.com', username: 'testuser', password: 'Password123!' }))
        .rejects.toThrow(AppError);
    });

    it('should create user and return auth response', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.createUser.mockResolvedValue(mockUser());
      mockRepo.createAuditLog.mockResolvedValue({} as any);
      mockRepo.createEmailVerificationToken.mockResolvedValue({} as any);
      mockRepo.createRefreshToken.mockResolvedValue({} as any);

      const result = await service.register({ email: 'new@example.com', username: 'newuser', password: 'Password123!' });
      expect(result.user).toBeTruthy();
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });
  });

  describe('login', () => {
    it('should throw for invalid credentials', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'wrong@example.com', password: 'wrong', rememberMe: false }))
        .rejects.toThrow(AppError);
    });

    it('should throw for inactive account', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...mockUser(), isActive: false });
      await expect(service.login({ email: 'test@example.com', password: 'Password123!', rememberMe: false }))
        .rejects.toThrow(AppError);
    });

    it('should throw for locked account', async () => {
      mockRepo.findByEmail.mockResolvedValue({
        ...mockUser(),
        lockedUntil: new Date(Date.now() + 600000),
      });
      await expect(service.login({ email: 'test@example.com', password: 'Password123!', rememberMe: false }))
        .rejects.toThrow(AppError);
    });

    it('should increment login attempts on failed login', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUser());
      mockRepo.incrementLoginAttempts.mockResolvedValue({} as any);
      await expect(service.login({ email: 'test@example.com', password: 'wrong', rememberMe: false }))
        .rejects.toThrow(AppError);
      expect(mockRepo.incrementLoginAttempts).toHaveBeenCalledWith('user-1');
    });

    it('should lock account after max attempts', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...mockUser(), loginAttempts: 4 });
      mockRepo.incrementLoginAttempts.mockResolvedValue({} as any);
      mockRepo.lockUser.mockResolvedValue({} as any);
      mockRepo.createAuditLog.mockResolvedValue({} as any);
      await expect(service.login({ email: 'test@example.com', password: 'wrong', rememberMe: false }))
        .rejects.toThrow(AppError);
      expect(mockRepo.lockUser).toHaveBeenCalled();
    });
  });
});
