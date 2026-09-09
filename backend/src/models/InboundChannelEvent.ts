import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const INBOUND_EVENT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'dead',
  'ignored',
] as const;

const inboundChannelEventSchema = new Schema(
  {
    provider: { type: String, enum: ['greenapi'], required: true },
    externalMessageId: { type: String, required: true, trim: true },
    instanceId: { type: String, required: true, trim: true },
    chatId: { type: String, required: true, trim: true },
    senderName: { type: String, default: null, trim: true, maxlength: 200 },
    messageType: { type: String, required: true, trim: true, maxlength: 100 },
    text: { type: String, default: null, maxlength: 8000 },
    status: {
      type: String,
      enum: INBOUND_EVENT_STATUSES,
      required: true,
      default: 'pending',
    },
    attempts: { type: Number, default: 0, min: 0 },
    availableAt: { type: Date, default: () => new Date() },
    lockedAt: { type: Date, default: null },
    lastError: { type: String, default: null, maxlength: 500 },
    receivedAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
    rawMetadata: {
      webhookType: { type: String, required: true, maxlength: 100 },
      webhookTimestamp: { type: Number, default: null },
    },
  },
  { timestamps: true },
);

inboundChannelEventSchema.index(
  { provider: 1, externalMessageId: 1 },
  { unique: true },
);
inboundChannelEventSchema.index({
  status: 1,
  availableAt: 1,
  lockedAt: 1,
  receivedAt: 1,
});

export type InboundChannelEventDoc =
  InferSchemaType<typeof inboundChannelEventSchema> & {
    _id: Types.ObjectId;
  };

export const InboundChannelEvent = model(
  'InboundChannelEvent',
  inboundChannelEventSchema,
);
