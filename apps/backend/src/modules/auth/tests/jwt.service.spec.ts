import { describe, it, expect } from 'vitest';
import { JwtService } from '../services/jwt.service';

describe('JwtService', () => {
  it('should sign and verify an access token', () => {
    const payload = { userId: 'user-1', role: 'USER' };
    const token = JwtService.signAccessToken(payload);
    expect(token).toBeTruthy();
    const decoded = JwtService.verifyAccessToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded!.userId).toBe('user-1');
    expect(decoded!.role).toBe('USER');
  });

  it('should return null for invalid access token', () => {
    const result = JwtService.verifyAccessToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should return null for expired access token', async () => {
    const jwt = await import('jsonwebtoken');
    const expiredToken = jwt.default.sign(
      { userId: 'user-1', role: 'USER' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '0s' },
    );
    await new Promise(r => setTimeout(r, 10));
    const result = JwtService.verifyAccessToken(expiredToken);
    expect(result).toBeNull();
  });

  it('should sign and verify a refresh token', () => {
    const payload = { userId: 'user-1', tokenId: 'token-1' };
    const token = JwtService.signRefreshToken(payload);
    expect(token).toBeTruthy();
    const decoded = JwtService.verifyRefreshToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded!.userId).toBe('user-1');
    expect(decoded!.tokenId).toBe('token-1');
  });

  it('should sign a long-lived refresh token for remember-me', () => {
    const payload = { userId: 'user-1', tokenId: 'token-1' };
    const token = JwtService.signRefreshTokenLong(payload);
    expect(token).toBeTruthy();
    const decoded = JwtService.verifyRefreshToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded!.userId).toBe('user-1');
  });

  it('should return null for invalid refresh token', () => {
    const result = JwtService.verifyRefreshToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should return correct expiry seconds for access token', () => {
    const expiry = JwtService.getAccessTokenExpirySeconds();
    expect(expiry).toBe(900);
  });

  it('should return correct expiry days for refresh tokens', () => {
    expect(JwtService.getRefreshTokenExpiryDays(false)).toBe(30);
    expect(JwtService.getRefreshTokenExpiryDays(true)).toBe(90);
  });
});
