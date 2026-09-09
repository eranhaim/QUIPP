import { Schema, model, type InferSchemaType } from 'mongoose';

export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];
export const MESSAGE_CHANNELS = ['web', 'greenapi'] as const;
export const DELIVERY_STATUSES = ['pending', 'sent', 'delivered', 'failed'] as const;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    channel: { type: String, enum: MESSAGE_CHANNELS, default: 'web', index: true },
    externalMessageId: { type: String, default: null, trim: true },
    role: { type: String, required: true, enum: MESSAGE_ROLES },
    content: { type: String, required: true, maxlength: 8000 },
    toolMetadata: { type: Schema.Types.Mixed, default: null },
    deliveryStatus: {
      type: String,
      enum: DELIVERY_STATUSES,
      default: 'delivered',
      index: true,
    },
  },
  { timestamps: true },
);

messageSchema.index(
  { channel: 1, externalMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalMessageId: { $type: 'string' } },
  },
);
messageSchema.index({ conversationId: 1, createdAt: -1 });

export type MessageDoc = InferSchemaType<typeof messageSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Message = model('Message', messageSchema);
