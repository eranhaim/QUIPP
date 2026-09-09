import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ChannelIdentity } from '../models/ChannelIdentity.js';
import { Conversation } from '../models/Conversation.js';
import { WhatsAppLinkCode } from '../models/WhatsAppLinkCode.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LINK_CODE_PATTERN = /^QUIPP-[A-Z2-9]{6}$/;

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function hashCode(code: string): string {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(`greenapi-link:${normalizeCode(code)}`)
    .digest('hex');
}

function generateCode(): string {
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (const byte of bytes) {
    suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `QUIPP-${suffix}`;
}

export function isWhatsAppLinkCode(value: string): boolean {
  return LINK_CODE_PATTERN.test(normalizeCode(value));
}

export async function createWhatsAppLinkCode(userId: string): Promise<{
  code: string;
  expiresAt: string;
}> {
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await WhatsAppLinkCode.deleteMany({ userId, usedAt: null });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateCode();
    try {
      await WhatsAppLinkCode.create({
        userId,
        codeHash: hashCode(code),
        expiresAt,
      });
      return { code, expiresAt: expiresAt.toISOString() };
    } catch (error) {
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        error.code !== 11000
      ) {
        throw error;
      }
    }
  }
  throw new Error('Could not create a unique WhatsApp link code');
}

export async function consumeWhatsAppLinkCode(input: {
  code: string;
  channelIdentityId: string;
  principalKey: string;
}): Promise<string | null> {
  if (!isWhatsAppLinkCode(input.code)) return null;

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const now = new Date();
      const linkCode = await WhatsAppLinkCode.findOneAndUpdate(
        {
          codeHash: hashCode(input.code),
          usedAt: null,
          expiresAt: { $gt: now },
        },
        { $set: { usedAt: now } },
        { new: true, session },
      );
      if (!linkCode) {
        const usedCode = await WhatsAppLinkCode.findOne({
          codeHash: hashCode(input.code),
          usedAt: { $ne: null },
          expiresAt: { $gt: now },
        }).session(session);
        if (!usedCode) return null;
        const alreadyLinked = await ChannelIdentity.exists({
          _id: input.channelIdentityId,
          provider: 'greenapi',
          userId: usedCode.userId,
        }).session(session);
        return alreadyLinked ? String(usedCode.userId) : null;
      }

      const identity = await ChannelIdentity.findOneAndUpdate(
        { _id: input.channelIdentityId, provider: 'greenapi' },
        {
          $set: {
            userId: linkCode.userId,
            linkedAt: now,
          },
        },
        { new: true, session },
      );
      if (!identity) throw new Error('WhatsApp channel identity no longer exists');

      await Conversation.updateMany(
        { principalKey: input.principalKey, channel: 'greenapi' },
        { $set: { userId: linkCode.userId } },
        { session },
      );
      return String(linkCode.userId);
    });
  } finally {
    await session.endSession();
  }
}
