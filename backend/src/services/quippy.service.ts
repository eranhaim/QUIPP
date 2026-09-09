import type { Response } from 'express';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { getQuippyGraph } from '../agents/quippy/graph.js';
import type {
  QuippyChannel,
  QuippyMode,
  ModelUsage,
} from '../agents/quippy/state.js';
import { consumeAgentRateLimit } from '../models/AgentUsage.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logger } from '../lib/logger.js';

export function isQuippyConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

async function getOrCreateConversation(input: {
  principalKey: string;
  channel: QuippyChannel;
  userId?: string;
  mode?: QuippyMode;
}) {
  const existing = await Conversation.findOne({
    principalKey: input.principalKey,
    channel: input.channel,
  }).sort({ lastMessageAt: -1 });
  if (existing) return existing;
  try {
    return await Conversation.create({
      principalKey: input.principalKey,
      channel: input.channel,
      mode: input.mode ?? 'general',
      userId: input.userId ?? null,
      title: 'QUIPPY',
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      const raced = await Conversation.findOne({
        principalKey: input.principalKey,
        channel: input.channel,
        mode: input.mode ?? 'general',
      });
      if (raced) return raced;
    }
    throw error;
  }
}

export interface PublicMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export async function fetchConversation(
  userId: string,
  limit = 40,
): Promise<{
  conversationId: string;
  messages: PublicMessage[];
  configured: boolean;
}> {
  const conv = await getOrCreateConversation({
    userId,
    principalKey: `user:${userId}`,
    channel: 'web',
  });
  const msgs = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const messages = msgs.reverse().map((m) => ({
    id: String(m._id),
    role: m.role as 'user' | 'assistant',
    content: m.content,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: ((m as any).createdAt as Date).toISOString(),
  }));
  return {
    conversationId: String(conv._id),
    messages,
    configured: isQuippyConfigured(),
  };
}

export interface GenerateReplyInput {
  userId?: string;
  principalKey: string;
  channel: QuippyChannel;
  content: string;
  externalMessageId?: string;
  requestId?: string;
}

export interface GenerateReplyResult {
  text: string;
  metadata: {
    conversationId: string;
    intent: string;
    tools: unknown[];
    validationIssues: string[];
    idempotentReplay: boolean;
    modelUsage: ModelUsage | null;
  };
}

async function findIdempotentReply(
  channel: QuippyChannel,
  externalMessageId: string,
): Promise<GenerateReplyResult | null> {
  const inbound = await Message.findOne({ channel, externalMessageId }).lean();
  if (!inbound) return null;
  const reply = await Message.findOne({
    conversationId: inbound.conversationId,
    role: 'assistant',
    'toolMetadata.inReplyToExternalMessageId': externalMessageId,
  }).lean();
  if (!reply) return null;
  const metadata =
    (reply.toolMetadata as {
      intent?: string;
      tools?: unknown[];
      validationIssues?: string[];
      modelUsage?: ModelUsage | null;
    } | null) ?? {};
  return {
    text: reply.content,
    metadata: {
      conversationId: String(reply.conversationId),
      intent: metadata.intent ?? 'general',
      tools: metadata.tools ?? [],
      validationIssues: metadata.validationIssues ?? [],
      idempotentReplay: true,
      modelUsage: metadata.modelUsage ?? null,
    },
  };
}

export async function generateReply(
  input: GenerateReplyInput,
): Promise<GenerateReplyResult> {
  const startedAt = performance.now();
  const correlationId =
    input.requestId ??
    (input.externalMessageId ? `greenapi-message:${input.externalMessageId}` : 'untracked');
  if (!isQuippyConfigured()) {
    throw new HttpError(503, 'QUIPPY is warming up — check back soon.');
  }
  const principalKey = input.principalKey.trim();
  if (!principalKey) throw new HttpError(400, 'principalKey is required');
  const trimmed = input.content.trim();
  if (!trimmed) throw new HttpError(400, 'Message cannot be empty');
  if (trimmed.length > 2000) throw new HttpError(400, 'Message is too long');

  let inbound = input.externalMessageId
    ? await Message.findOne({
        channel: input.channel,
        externalMessageId: input.externalMessageId,
      })
    : null;
  if (input.externalMessageId) {
    const replay = await findIdempotentReply(
      input.channel,
      input.externalMessageId,
    );
    if (replay) {
      logger.info('quippy.execution.replayed', {
        correlationId,
        channel: input.channel,
        conversationId: replay.metadata.conversationId,
        latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      });
      return replay;
    }
  }

  if (!inbound && !(await consumeAgentRateLimit(principalKey))) {
    throw new HttpError(
      429,
      'You have hit the QUIPPY chat limit. Try again in an hour.',
    );
  }

  const conv = inbound
    ? await Conversation.findOne({
        _id: inbound.conversationId,
        principalKey,
        channel: input.channel,
      })
    : await getOrCreateConversation({
        principalKey,
        channel: input.channel,
        userId: input.userId,
      });
  if (!conv) {
    throw new HttpError(409, 'This external message belongs to another conversation.');
  }

  if (!inbound) {
    try {
      inbound = await Message.create({
        conversationId: conv._id,
        userId: input.userId ?? null,
        channel: input.channel,
        externalMessageId: input.externalMessageId ?? null,
        role: 'user',
        content: trimmed,
        deliveryStatus: 'delivered',
      });
    } catch (error) {
      if (
        input.externalMessageId &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        const replay = await findIdempotentReply(
          input.channel,
          input.externalMessageId,
        );
        if (replay) return replay;
        throw new HttpError(409, 'This message is already being processed.');
      }
      throw error;
    }
  } else {
    if (input.userId) inbound.userId = new Types.ObjectId(input.userId);
    inbound.content = trimmed;
    inbound.toolMetadata = null;
    await inbound.save();
  }

  const priorRaw = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: -1 })
    .limit(21)
    .lean();
  const history = priorRaw
    .filter((message) => String(message._id) !== String(inbound._id))
    .slice(0, 20)
    .reverse()
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    }));

  const graph = await getQuippyGraph();
  let result;
  logger.info('quippy.execution.started', {
    correlationId,
    channel: input.channel,
    conversationId: String(conv._id),
    inputCharacters: trimmed.length,
    historyTurns: history.length,
  });
  try {
    result = await graph.invoke(
      {
        principalKey,
        userId: input.userId ?? null,
        channel: input.channel,
        mode: conv.mode as QuippyMode,
        content: trimmed,
        history,
      },
      {
        configurable: {
          thread_id: `${input.channel}:${principalKey}:${conv.mode}`,
        },
        recursionLimit: 10,
      },
    );
  } catch (error) {
    inbound.toolMetadata = {
      processingError: error instanceof Error ? error.message : 'Unknown error',
    };
    await inbound.save();
    logger.error('quippy.execution.failed', {
      correlationId,
      channel: input.channel,
      conversationId: String(conv._id),
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    if (
      error instanceof AggregateError &&
      error.message.includes('checkpoint setup failed')
    ) {
      throw new HttpError(503, 'QUIPPY conversation persistence is unavailable.');
    }
    throw new HttpError(502, 'QUIPPY could not respond right now. Try again.');
  }

  const text = result.response.trim();
  if (!text) throw new HttpError(502, 'QUIPPY returned an empty response.');
  const toolMetadata = {
    intent: result.intent,
    tools: result.toolMetadata,
    validationIssues: result.validationIssues,
    modelUsage: result.modelUsage,
    inReplyToExternalMessageId: input.externalMessageId ?? null,
  };
  await Message.create({
    conversationId: conv._id,
    userId: input.userId ?? null,
    channel: input.channel,
    role: 'assistant',
    content: text,
    toolMetadata,
    deliveryStatus: input.channel === 'web' ? 'delivered' : 'pending',
  });
  conv.lastMessageAt = new Date();
  await conv.save();

  logger.info('quippy.execution.completed', {
    correlationId,
    channel: input.channel,
    conversationId: String(conv._id),
    intent: result.intent,
    tools: result.toolMetadata.map((item) => ({
      tool: item.tool,
      authorized: item.authorized,
      resultCount: item.resultCount ?? null,
    })),
    validationIssueCount: result.validationIssues.length,
    outputCharacters: text.length,
    latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
    modelUsage: result.modelUsage,
  });

  return {
    text,
    metadata: {
      conversationId: String(conv._id),
      intent: result.intent,
      tools: result.toolMetadata,
      validationIssues: result.validationIssues,
      idempotentReplay: false,
      modelUsage: result.modelUsage,
    },
  };
}

/**
 * Keep the existing web streaming contract. The controlled graph completes
 * before headers are sent, then the validated final response is one text chunk.
 */
export async function streamReply(
  userId: string,
  userContent: string,
  res: Response,
  requestId?: string,
): Promise<void> {
  const reply = await generateReply({
    userId,
    principalKey: `user:${userId}`,
    channel: 'web',
    content: userContent,
    requestId,
  });
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(reply.text);
  res.end();
}
