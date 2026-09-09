import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * A private QUIPPY thread scoped to a principal, channel, and mode. `userId`
 * remains optional so an unlinked external-channel identity can have a thread
 * without being treated as an authenticated platform user.
 */
export const CONVERSATION_CHANNELS = ['web', 'greenapi'] as const;
export const CONVERSATION_MODES = ['general', 'equipment'] as const;

const conversationSchema = new Schema(
  {
    principalKey: { type: String, required: true, trim: true },
    channel: { type: String, enum: CONVERSATION_CHANNELS, required: true, default: 'web' },
    mode: { type: String, enum: CONVERSATION_MODES, required: true, default: 'general' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, default: 'QUIPPY' },
    lastMessageAt: { type: Date, default: () => new Date() },
  },
  // Indexes are installed by the startup migration after legacy rows are
  // backfilled and the old unique userId index is removed.
  { timestamps: true, autoIndex: false },
);

conversationSchema.index({ principalKey: 1, channel: 1, mode: 1 }, { unique: true });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });

export type ConversationDoc = InferSchemaType<typeof conversationSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Conversation = model('Conversation', conversationSchema);
