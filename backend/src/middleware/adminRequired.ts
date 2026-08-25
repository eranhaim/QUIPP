import type { Request, Response, NextFunction } from 'express';
import { authRequired } from './authRequired.js';
import { HttpError } from './errorHandler.js';

/**
 * Composed middleware that verifies the caller has a valid access token AND
 * the `admin` role. Prefer this over stacking `authRequired, requireRole('admin')`
 * so admin routes read as one line.
 */
export function adminRequired(req: Request, res: Response, next: NextFunction): void {
  authRequired(req, res, (err?: unknown) => {
    if (err) return next(err);
    if (!req.auth?.roles.includes('admin')) {
      return next(new HttpError(403, 'Admin access required'));
    }
    next();
  });
}
