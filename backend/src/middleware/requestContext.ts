import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function resolveRequestId(incoming: string | undefined): string {
  const candidate = incoming?.trim();
  return candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();
}

export const requestContext: RequestHandler = (req, res, next) => {
  const startedAt = performance.now();
  req.requestId = resolveRequestId(req.header('x-request-id'));
  res.setHeader('X-Request-Id', req.requestId);

  res.on('finish', () => {
    logger.info('http.request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
    });
  });
  next();
};
