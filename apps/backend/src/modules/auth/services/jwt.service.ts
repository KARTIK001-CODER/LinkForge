import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-dev-only';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev-only';
const ACCESS_TOKEN_EXPIRY = '15m';
const REMEMBER_ME_EXPIRY = '90d';
const DEFAULT_REFRESH_EXPIRY = '30d';

export class JwtService {
  static signAccessToken(payload: { userId: string; role: string }): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  static verifyAccessToken(token: string): { userId: string; role: string } | null {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; role: string };
    } catch {
      return null;
    }
  }

  static signRefreshToken(payload: { userId: string; tokenId: string }): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: DEFAULT_REFRESH_EXPIRY });
  }

  static signRefreshTokenLong(payload: { userId: string; tokenId: string }): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REMEMBER_ME_EXPIRY });
  }

  static verifyRefreshToken(token: string): { userId: string; tokenId: string } | null {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string; tokenId: string };
    } catch {
      return null;
    }
  }

  static getAccessTokenExpirySeconds(): number {
    return 15 * 60;
  }

  static getRefreshTokenExpiryDays(rememberMe: boolean): number {
    return rememberMe ? 90 : 30;
  }
}
