import { Response } from 'express';

const COOKIE_NAME = 'linkforge_refresh_token';
const SECURE = process.env.NODE_ENV === 'production';
const SAME_SITE = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
const PATH = '/api/v1/auth';

export class CookieService {
  static setRefreshCookie(res: Response, token: string, maxAgeDays: number) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      path: PATH,
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    });
  }

  static clearRefreshCookie(res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: SECURE,
      sameSite: SAME_SITE,
      path: PATH,
    });
  }
}
