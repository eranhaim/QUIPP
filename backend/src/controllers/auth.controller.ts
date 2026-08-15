import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  registerUser,
  verifyCredentials,
  consumeEmailToken,
  markEmailVerified,
  requestPasswordReset,
  resetPassword,
  getUserById,
} from '../services/auth.service.js';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  findValidRefreshUserId,
} from '../services/token.service.js';
import { HttpError } from '../middleware/errorHandler.js';
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from '../lib/cookies.js';
import { User } from '../models/User.js';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(200);

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const verifyEmailSchema = z.object({ token: z.string().min(1) });
const requestResetSchema = z.object({ email: emailSchema });
const resetSchema = z.object({ token: z.string().min(1), password: passwordSchema });

function reqCtx(req: Request) {
  return {
    userAgent: req.header('user-agent') ?? null,
    ip: (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip ?? null,
  };
}

async function issueSession(res: Response, userId: string, ctx: { userAgent: string | null; ip: string | null }) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(500, 'User missing during session issue');
  const access = signAccessToken({ sub: String(user._id), roles: user.roles });
  const refresh = await issueRefreshToken({ userId: String(user._id), ...ctx });
  setRefreshCookie(res, refresh);
  return access;
}

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const user = await registerUser(body);
  const access = await issueSession(res, user.id, reqCtx(req));
  res.status(201).json({ user, accessToken: access });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const user = await verifyCredentials(body.email, body.password);
  const access = await issueSession(res, user.id, reqCtx(req));
  res.json({ user, accessToken: access });
}

export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (raw) await revokeRefreshToken(raw);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw new HttpError(401, 'Missing refresh token');
  const userId = await findValidRefreshUserId(raw);
  if (!userId) {
    clearRefreshCookie(res);
    throw new HttpError(401, 'Refresh token invalid');
  }
  const ctx = reqCtx(req);
  const newRefresh = await rotateRefreshToken(raw, { userId, ...ctx });
  setRefreshCookie(res, newRefresh);
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, 'User no longer exists');
  const access = signAccessToken({ sub: String(user._id), roles: user.roles });
  res.json({ accessToken: access });
}

export async function verifyEmail(req: Request, res: Response) {
  const body = verifyEmailSchema.parse(req.body);
  const userId = await consumeEmailToken(body.token, 'verify_email');
  await markEmailVerified(userId);
  res.status(204).end();
}

export async function startPasswordReset(req: Request, res: Response) {
  const body = requestResetSchema.parse(req.body);
  await requestPasswordReset(body.email);
  res.status(204).end();
}

export async function completePasswordReset(req: Request, res: Response) {
  const body = resetSchema.parse(req.body);
  const userId = await consumeEmailToken(body.token, 'password_reset');
  await resetPassword(userId, body.password);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const user = await getUserById(req.auth.sub);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
}
