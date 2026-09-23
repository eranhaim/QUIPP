import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { ChannelIdentity } from '../models/ChannelIdentity.js';
import {
  InboundChannelEvent,
  type InboundChannelEventDoc,
} from '../models/InboundChannelEvent.js';
import { Message } from '../models/Message.js';
import { generateReply } from './quippy.service.js';
import {
  greenApiClient,
  type OutboundTextSender,
} from './greenApi.client.js';
import {
  consumeWhatsAppLinkCode,
  isWhatsAppLinkCode,
} from './whatsAppLink.service.js';
import { classifyGreenApiCommand } from './greenApiParsing.js';
import { replyToWhatsAppCourseLead } from './whatsAppCourseLeadBot.service.js';

const POLL_INTERVAL_MS = 1_000;
const STALE_LOCK_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_EVENTS_PER_CYCLE = 20;
function safeError(error: unknown): string {
  const name = error instanceof Error ? error.name : 'UnknownError';
  return `${name}: GreenAPI event processing failed`;
}

export class GreenApiWorker {
  private running = false;
  private processing = false;
  private timer: NodeJS.Timeout | null = null;
  private cyclePromise: Promise<void> | null = null;

  constructor(
    private readonly sender: OutboundTextSender = greenApiClient,
    private readonly configured: () => boolean = () => greenApiClient.isConfigured(),
    private readonly enabled: () => boolean = () => env.GREEN_API_ENABLED,
  ) {}

  getState() {
    return { running: this.running, processing: this.processing };
  }

  start(): boolean {
    if (this.running) return true;
    if (!this.enabled() || !this.configured()) {
      logger.info('GreenAPI worker remains off', {
        enabled: this.enabled(),
        configured: this.configured(),
      });
      return false;
    }
    this.running = true;
    logger.info('GreenAPI worker started');
    this.schedule(0);
    return true;
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.cyclePromise;
    logger.info('GreenAPI worker stopped');
  }

  private schedule(delayMs: number) {
    if (!this.running || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.cyclePromise = this.runCycle().finally(() => {
        this.cyclePromise = null;
        if (this.running) this.schedule(POLL_INTERVAL_MS);
      });
    }, delayMs);
    this.timer.unref();
  }

  private async runCycle(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      for (let count = 0; count < MAX_EVENTS_PER_CYCLE && this.running; count += 1) {
        const event = await this.claimNextEvent();
        if (!event) break;
        const startedAt = performance.now();
        const correlationId = `greenapi-event:${String(event._id)}`;
        logger.info('greenapi.event.started', {
          correlationId,
          eventId: String(event._id),
          attempt: Number(event.attempts),
          messageType: event.messageType,
        });
        try {
          await this.processEvent(event);
          logger.info('greenapi.event.completed', {
            correlationId,
            eventId: String(event._id),
            latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
          });
        } catch (error) {
          logger.warn('greenapi.event.failed', {
            correlationId,
            eventId: String(event._id),
            latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
            error: safeError(error),
          });
          await this.recordFailure(event, error);
        }
      }
    } catch (error) {
      logger.error('GreenAPI worker polling failed', safeError(error));
    } finally {
      this.processing = false;
    }
  }

  private claimNextEvent() {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
    return InboundChannelEvent.findOneAndUpdate(
      {
        provider: 'greenapi',
        $or: [
          {
            status: { $in: ['pending', 'failed'] },
            availableAt: { $lte: now },
          },
          {
            status: 'processing',
            lockedAt: { $lte: staleBefore },
          },
        ],
      },
      {
        $set: {
          status: 'processing',
          lockedAt: now,
          lastError: null,
        },
        $inc: { attempts: 1 },
      },
      { new: true, sort: { receivedAt: 1 } },
    );
  }

  private async processEvent(event: InboundChannelEventDoc): Promise<void> {
    const text = event.text?.trim();
    if (!text) {
      await this.markIgnored(event);
      return;
    }

    const principalKey = `greenapi:${event.chatId}`;
    const identity = await ChannelIdentity.findOne({
      provider: 'greenapi',
      externalId: event.chatId,
    });
    if (!identity) throw new Error('GreenAPI channel identity was not found');

    if (isWhatsAppLinkCode(text)) {
      const userId = await consumeWhatsAppLinkCode({
        code: text,
        channelIdentityId: String(identity._id),
        principalKey,
      });
      await this.sender.sendText({
        chatId: event.chatId,
        message: userId
          ? identity.status === 'opted_out'
            ? 'Your QUIPP account is linked. Send START or חזרה to resume messages.'
            : 'Your WhatsApp is now linked to your QUIPP account.'
          : 'That QUIPP link code is invalid or expired. Create a new code in Settings.',
      });
      await this.markCompleted(event);
      return;
    }

    const command = classifyGreenApiCommand(text);
    if (command === 'opt_out') {
      await ChannelIdentity.updateOne(
        { _id: identity._id },
        { $set: { status: 'opted_out' } },
      );
      await this.sender.sendText({
        chatId: event.chatId,
        message: 'You are unsubscribed from QUIPPY messages. Send START or חזרה to return.',
      });
      await this.markCompleted(event);
      return;
    }

    if (command === 'opt_in') {
      if (identity.status === 'opted_out') {
        await ChannelIdentity.updateOne(
          { _id: identity._id },
          { $set: { status: 'active' } },
        );
      }
      await this.sender.sendText({
        chatId: event.chatId,
        message: 'QUIPPY messages are enabled again.',
      });
      await this.markCompleted(event);
      return;
    }

    if (identity.status === 'opted_out') {
      await this.markIgnored(event);
      return;
    }

    if (env.GREEN_API_LEAD_BOT_ENABLED) {
      const reply = await replyToWhatsAppCourseLead({
        chatId: event.chatId,
        senderName: event.senderName ?? null,
        text,
      });
      await this.sender.sendText({
        chatId: event.chatId,
        message: reply,
      });
      await this.markCompleted(event);
      return;
    }

    if (text.length > 2000) {
      await this.sender.sendText({
        chatId: event.chatId,
        message: 'Please shorten your message to 2,000 characters or fewer.',
      });
      await this.markCompleted(event);
      return;
    }

    const existingAssistant = await this.findAssistant(event.externalMessageId);
    if (existingAssistant?.deliveryStatus === 'delivered') {
      await this.markCompleted(event);
      return;
    }

    const reply = await generateReply({
      userId: identity.userId ? String(identity.userId) : undefined,
      principalKey,
      channel: 'greenapi',
      content: text,
      externalMessageId: event.externalMessageId,
      requestId: `greenapi-event:${String(event._id)}`,
    });
    const assistant =
      existingAssistant ?? (await this.findAssistant(event.externalMessageId));
    if (!assistant) throw new Error('Generated QUIPPY reply was not persisted');

    try {
      const sent = await this.sender.sendText({
        chatId: event.chatId,
        message: reply.text,
      });
      await Message.updateOne(
        { _id: assistant._id },
        {
          $set: {
            deliveryStatus: 'delivered',
            'toolMetadata.outboundExternalMessageId': sent.externalMessageId,
          },
        },
      );
    } catch (error) {
      await Message.updateOne(
        { _id: assistant._id },
        { $set: { deliveryStatus: 'failed' } },
      );
      throw error;
    }
    await this.markCompleted(event);
  }

  private findAssistant(externalMessageId: string) {
    return Message.findOne({
      channel: 'greenapi',
      role: 'assistant',
      'toolMetadata.inReplyToExternalMessageId': externalMessageId,
    });
  }

  private markCompleted(event: InboundChannelEventDoc) {
    return InboundChannelEvent.updateOne(
      { _id: event._id },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      },
    );
  }

  private markIgnored(event: InboundChannelEventDoc) {
    return InboundChannelEvent.updateOne(
      { _id: event._id },
      {
        $set: {
          status: 'ignored',
          completedAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      },
    );
  }

  private recordFailure(event: InboundChannelEventDoc, error: unknown) {
    const attempts = Number(event.attempts);
    const dead = attempts >= MAX_ATTEMPTS;
    const backoffMs = Math.min(60_000, 1_000 * 2 ** Math.max(0, attempts - 1));
    const lastError = safeError(error);
    logger.warn('GreenAPI event processing failed', {
      eventId: String(event._id),
      attempts,
      dead,
      error: lastError,
    });
    return InboundChannelEvent.updateOne(
      { _id: event._id },
      {
        $set: {
          status: dead ? 'dead' : 'failed',
          availableAt: new Date(Date.now() + backoffMs),
          lockedAt: null,
          lastError,
          completedAt: dead ? new Date() : null,
        },
      },
    );
  }
}

export const greenApiWorker = new GreenApiWorker();
