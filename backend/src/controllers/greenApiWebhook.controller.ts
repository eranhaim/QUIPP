import crypto from 'crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ChannelIdentity } from '../models/ChannelIdentity.js';
import { InboundChannelEvent } from '../models/InboundChannelEvent.js';
import { QuippyProfile } from '../models/QuippyProfile.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  extractGreenApiMessageText,
  normalizeGreenApiPhone,
} from '../services/greenApiParsing.js';

const envelopeSchema = z.object({
  typeWebhook: z.string().min(1).max(100),
  instanceData: z.object({
    idInstance: z.union([z.string(), z.number()]).transform(String),
  }),
  idMessage: z.string().min(1).max(200).optional(),
  timestamp: z.number().optional(),
  senderData: z
    .object({
      chatId: z.string().min(1).max(200),
      senderName: z.string().max(200).optional(),
    })
    .optional(),
  messageData: z
    .object({
      typeMessage: z.string().min(1).max(100),
      textMessageData: z
        .object({ textMessage: z.string().max(8000) })
        .optional(),
      extendedTextMessageData: z
        .object({ text: z.string().max(8000) })
        .optional(),
    })
    .passthrough()
    .optional(),
});

const incomingMessageSchema = envelopeSchema.extend({
  idMessage: z.string().min(1).max(200),
  senderData: z.object({
    chatId: z.string().min(1).max(200),
    senderName: z.string().max(200).optional(),
  }),
  messageData: z
    .object({
      typeMessage: z.string().min(1).max(100),
      textMessageData: z
        .object({ textMessage: z.string().max(8000) })
        .optional(),
      extendedTextMessageData: z
        .object({ text: z.string().max(8000) })
        .optional(),
    })
    .passthrough(),
});

function constantTimeEqual(candidate: string, expected: string): boolean {
  const candidateDigest = crypto.createHash('sha256').update(candidate).digest();
  const expectedDigest = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateDigest, expectedDigest);
}

function bearerToken(req: Request): string | null {
  const match = req.header('authorization')?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function greenApiWebhook(req: Request, res: Response) {
  if (
    !env.GREEN_API_ID_INSTANCE ||
    !env.GREEN_API_TOKEN_INSTANCE ||
    !env.GREEN_API_WEBHOOK_TOKEN
  ) {
    throw new HttpError(503, 'GreenAPI webhook is not configured');
  }

  const token = bearerToken(req);
  if (!token || !constantTimeEqual(token, env.GREEN_API_WEBHOOK_TOKEN)) {
    throw new HttpError(401, 'Invalid webhook authorization');
  }
  if (req.params.instanceId !== env.GREEN_API_ID_INSTANCE) {
    throw new HttpError(404, 'GreenAPI instance not found');
  }

  const envelope = envelopeSchema.parse(req.body);
  if (envelope.instanceData.idInstance !== env.GREEN_API_ID_INSTANCE) {
    throw new HttpError(400, 'Webhook instance does not match route');
  }
  if (envelope.typeWebhook !== 'incomingMessageReceived') {
    res.status(200).json({ accepted: true, ignored: true });
    return;
  }

  const payload = incomingMessageSchema.parse(req.body);
  const text = extractGreenApiMessageText(payload.messageData);
  const principalKey = `greenapi:${payload.senderData.chatId}`;
  const ignored = text === null || text.trim() === '';

  await Promise.all([
    ChannelIdentity.findOneAndUpdate(
      { provider: 'greenapi', externalId: payload.senderData.chatId },
      {
        $set: { phone: normalizeGreenApiPhone(payload.senderData.chatId) },
        $setOnInsert: { status: 'active' },
      },
      { upsert: true, new: true, runValidators: true },
    ),
    QuippyProfile.findOneAndUpdate(
      { principalKey },
      {
        $setOnInsert: {
          principalKey,
          language: 'en',
          onboardingStage: 'new',
        },
      },
      { upsert: true, new: true, runValidators: true },
    ),
  ]);

  let duplicate = false;
  try {
    const result = await InboundChannelEvent.updateOne(
      {
        provider: 'greenapi',
        externalMessageId: payload.idMessage,
      },
      {
        $setOnInsert: {
          instanceId: payload.instanceData.idInstance,
          chatId: payload.senderData.chatId,
          senderName: payload.senderData.senderName ?? null,
          messageType: payload.messageData.typeMessage,
          text,
          status: ignored ? 'ignored' : 'pending',
          completedAt: ignored ? new Date() : null,
          rawMetadata: {
            webhookType: payload.typeWebhook,
            webhookTimestamp: payload.timestamp ?? null,
          },
        },
      },
      { upsert: true },
    );
    duplicate = result.upsertedCount === 0;
  } catch (error) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      error.code !== 11000
    ) {
      throw error;
    }
    duplicate = true;
  }

  res.status(200).json({
    accepted: true,
    ignored,
    duplicate,
  });
}
