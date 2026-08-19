import bcrypt from 'bcryptjs';
import { HttpError } from '../middleware/errorHandler.js';
import { User, type AppRole } from '../models/User.js';
import { EmailToken, type EmailTokenPurpose } from '../models/EmailToken.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { sendMail } from './email.service.js';
import { createProfileForUser } from './profile.service.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 12;
const EMAIL_TOKEN_TTL_MIN = 60;

export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: AppRole[];
  emailVerified: boolean;
}

function toPublicUser(u: {
  _id: unknown;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: AppRole[];
  emailVerifiedAt?: Date | null;
}): PublicUser {
  return {
    id: String(u._id),
    email: u.email,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    roles: u.roles,
    emailVerified: !!u.emailVerifiedAt,
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    roles: ['worker'],
  });

  try {
    await createProfileForUser({
      userId: String(user._id),
      firstName: input.firstName ?? null,
      email,
    });
  } catch (err) {
    logger.error('Failed to create profile after registration', err);
    // fatal for the request — a user without a profile can't use most of the app
    await User.deleteOne({ _id: user._id });
    throw new HttpError(500, 'Could not complete registration. Please try again.');
  }

  await sendEmailToken(String(user._id), email, 'verify_email');
  return toPublicUser(user.toObject());
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser> {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !user.passwordHash) throw new HttpError(401, 'Invalid email or password');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid email or password');
  user.lastLoginAt = new Date();
  await user.save();
  return toPublicUser(user.toObject());
}

export async function sendEmailToken(
  userId: string,
  email: string,
  purpose: EmailTokenPurpose,
): Promise<void> {
  const raw = randomToken(24);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MIN * 60 * 1000);
  await EmailToken.create({ userId, tokenHash, purpose, expiresAt });

  const path = purpose === 'verify_email' ? '/verify-email' : '/reset-password';
  const link = `${env.APP_URL}${path}?token=${raw}`;
  const subject =
    purpose === 'verify_email' ? 'Verify your QUIPP email' : 'Reset your QUIPP password';
  const text =
    purpose === 'verify_email'
      ? `Welcome to QUIPP.\n\nVerify your email:\n${link}\n\nExpires in ${EMAIL_TOKEN_TTL_MIN} minutes.`
      : `Reset your password:\n${link}\n\nExpires in ${EMAIL_TOKEN_TTL_MIN} minutes. If you did not request this, ignore this email.`;

  await sendMail({ to: email, subject, text });
}

export async function consumeEmailToken(
  raw: string,
  purpose: EmailTokenPurpose,
): Promise<string> {
  const tokenHash = sha256(raw);
  const doc = await EmailToken.findOne({ tokenHash, purpose });
  if (!doc || doc.usedAt || doc.expiresAt < new Date()) {
    throw new HttpError(400, 'Invalid or expired token');
  }
  doc.usedAt = new Date();
  await doc.save();
  return String(doc.userId);
}

export async function markEmailVerified(userId: string): Promise<void> {
  await User.updateOne({ _id: userId }, { $set: { emailVerifiedAt: new Date() } });
}

export async function resetPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return;
  await sendEmailToken(String(user._id), user.email, 'password_reset');
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const user = await User.findById(userId);
  return user ? toPublicUser(user.toObject()) : null;
}
