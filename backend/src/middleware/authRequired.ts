import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../services/token.service.js';
import { HttpError } from './errorHandler.js';
import type { AppRole } from '../models/User.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing bearer token'));
  }
  const token = header.slice('Bearer '.length);
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireRole(role: AppRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(new HttpError(401, 'Not authenticated'));
    if (!req.auth.roles.includes(role)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}
