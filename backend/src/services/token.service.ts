import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { RefreshToken } from '../models/RefreshToken.js';
import type { AppRole } from '../models/User.js';

export interface AccessTokenPayload {
  sub: string;
  roles: AppRole[];
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TTL_MIN}m`,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export interface IssueRefreshOpts {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
}

export async function issueRefreshToken(opts: IssueRefreshOpts): Promise<string> {
  const raw = randomToken(48);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: opts.userId,
    tokenHash,
    expiresAt,
    userAgent: opts.userAgent ?? null,
    ip: opts.ip ?? null,
  });
  return raw;
}

export async function rotateRefreshToken(rawOld: string, opts: IssueRefreshOpts): Promise<string> {
  const oldHash = sha256(rawOld);
  const existing = await RefreshToken.findOne({ tokenHash: oldHash });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new Error('Refresh token invalid');
  }
  const raw = randomToken(48);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  existing.revokedAt = new Date();
  existing.replacedByHash = tokenHash;
  await existing.save();
  await RefreshToken.create({
    userId: opts.userId,
    tokenHash,
    expiresAt,
    userAgent: opts.userAgent ?? null,
    ip: opts.ip ?? null,
  });
  return raw;
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const tokenHash = sha256(raw);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}

export async function findValidRefreshUserId(raw: string): Promise<string | null> {
  const tokenHash = sha256(raw);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc || doc.revokedAt || doc.expiresAt < new Date()) return null;
  return String(doc.userId);
}
