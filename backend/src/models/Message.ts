import { Schema, model, type InferSchemaType } from 'mongoose';

export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true, enum: MESSAGE_ROLES },
    content: { type: String, required: true, maxlength: 8000 },
  },
  { timestamps: true },
);

export type MessageDoc = InferSchemaType<typeof messageSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Message = model('Message', messageSchema);
