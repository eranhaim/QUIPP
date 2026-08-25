import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * One conversation per worker (MVP: single equipment-consultant thread).
 * Worker-private: no operator/admin can query these except the message-count
 * for support diagnostics. See /api/quippy/* for enforcement.
 */
const conversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    title: { type: String, default: 'Equipment consultant' },
    lastMessageAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export type ConversationDoc = InferSchemaType<typeof conversationSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Conversation = model('Conversation', conversationSchema);
