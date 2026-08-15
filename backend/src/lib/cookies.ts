import type { Response } from 'express';
import { env, isProd } from '../config/env.js';

export const REFRESH_COOKIE = 'quipp_rt';

const secure = env.COOKIE_SECURE ?? isProd;

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
  });
}
