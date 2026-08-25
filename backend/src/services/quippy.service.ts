import Anthropic from '@anthropic-ai/sdk';
import type { Response } from 'express';
import { env } from '../config/env.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { WorkerTechDeclaration } from '../models/WorkerTechDeclaration.js';
import { Credential } from '../models/Credential.js';
import { HttpError } from '../middleware/errorHandler.js';

let cached: Anthropic | null = null;

export function isQuippyConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  if (!isQuippyConfigured()) {
    throw new HttpError(503, 'QUIPPY is warming up — check back soon.');
  }
  if (cached) return cached;
  cached = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });
  return cached;
}

const SYSTEM_PROMPT = [
  "You are QUIPPY, the Equipment Consultant inside QUIPP. QUIPP is a professional credentialing platform for hospitality workers.",
  "Voice: short, active, confident, human. Never use exclamation marks. End every reply with a clear next step.",
  "Scope: commercial kitchen and bar equipment, error codes, safe troubleshooting, when to stop and call a technician, and preventative care.",
  "Boundaries: if the question is off-topic (payroll, immigration, medical, legal), say so plainly in one sentence and redirect to equipment.",
  "Safety: never advise disabling interlocks, bypassing gas/electrical safety, or defeating burn/pressure protections. If you're unsure a step is safe, say so and route to a technician.",
  "Style: don't invent error codes. If you don't recognise a model or code, say so and ask one clarifying question. Prefer numbered steps for procedures.",
  "You remember the worker's declared equipment and credentials as context — use them to skip obvious questions.",
].join('\n');

export interface QuippyContext {
  firstName: string | null;
  declaredEquipment: Array<{ equipmentName: string; brand: string | null }>;
  credentials: Array<{ title: string; tier: string }>;
}

async function buildContext(userId: string): Promise<QuippyContext> {
  const [user, decls, creds] = await Promise.all([
    User.findById(userId).select({ firstName: 1 }).lean(),
    WorkerTechDeclaration.find({ userId })
      .select({ equipmentName: 1, brand: 1 })
      .limit(20)
      .lean(),
    Credential.find({ userId })
      .select({ courseName: 1, tier: 1 })
      .limit(20)
      .lean(),
  ]);
  return {
    firstName: user?.firstName ?? null,
    declaredEquipment: decls.map((d) => ({
      equipmentName: d.equipmentName,
      brand: d.brand ?? null,
    })),
    credentials: creds.map((c) => ({
      title: (c as unknown as { courseName: string }).courseName,
      tier: (c as unknown as { tier: string }).tier,
    })),
  };
}

function contextBlock(ctx: QuippyContext): string {
  const bits: string[] = [];
  if (ctx.firstName) bits.push(`Worker: ${ctx.firstName}.`);
  if (ctx.declaredEquipment.length) {
    bits.push(
      `Declared equipment: ${ctx.declaredEquipment
        .map((d) => (d.brand ? `${d.brand} ${d.equipmentName}` : d.equipmentName))
        .join(', ')}.`,
    );
  }
  if (ctx.credentials.length) {
    bits.push(
      `Earned credentials: ${ctx.credentials.map((c) => `${c.title} (${c.tier})`).join(', ')}.`,
    );
  }
  if (!bits.length) return '';
  return `\n\n<worker_context>\n${bits.join(' ')}\n</worker_context>`;
}

async function getOrCreateConversation(userId: string) {
  const existing = await Conversation.findOne({ userId });
  if (existing) return existing;
  return Conversation.create({ userId });
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
  const conv = await getOrCreateConversation(userId);
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

// In-memory rate limiter (30 msgs / hour / user). Sufficient for MVP; when we
// scale beyond one server this moves to Redis or a persisted counter.
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();
function checkRate(userId: string): void {
  const now = Date.now();
  const arr = hits.get(userId)?.filter((t) => now - t < RATE_WINDOW_MS) ?? [];
  if (arr.length >= RATE_MAX) {
    throw new HttpError(429, 'You have hit the QUIPPY chat limit. Try again in an hour.');
  }
  arr.push(now);
  hits.set(userId, arr);
}

/**
 * Stream a QUIPPY reply. Persists the user's message immediately, then streams
 * tokens to the response. On completion, persists the assistant message.
 */
export async function streamReply(
  userId: string,
  userContent: string,
  res: Response,
): Promise<void> {
  if (!isQuippyConfigured()) {
    throw new HttpError(503, 'QUIPPY is warming up — check back soon.');
  }
  checkRate(userId);
  const trimmed = userContent.trim();
  if (!trimmed) throw new HttpError(400, 'Message cannot be empty');
  if (trimmed.length > 2000) throw new HttpError(400, 'Message is too long');

  const conv = await getOrCreateConversation(userId);
  await Message.create({
    conversationId: conv._id,
    userId,
    role: 'user',
    content: trimmed,
  });

  const priorRaw = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const prior = priorRaw.reverse();
  const ctx = await buildContext(userId);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  let assembled = '';
  try {
    const stream = await client().messages.stream({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextBlock(ctx),
      messages: prior.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta' &&
        chunk.delta.text
      ) {
        assembled += chunk.delta.text;
        res.write(chunk.delta.text);
      }
    }
    await stream.finalMessage();
  } catch (err) {
    if (!assembled) {
      throw new HttpError(502, 'QUIPPY could not respond right now. Try again.');
    }
    // Partial reply is still useful; log server-side and continue.
    // eslint-disable-next-line no-console
    console.error('QUIPPY stream error after partial delivery', err);
  }

  if (assembled.trim()) {
    await Message.create({
      conversationId: conv._id,
      userId,
      role: 'assistant',
      content: assembled,
    });
    conv.lastMessageAt = new Date();
    await conv.save();
  }
  res.end();
}
