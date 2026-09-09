import { Schema, model, type InferSchemaType } from 'mongoose';

const whatsAppLinkCodeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    codeHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

whatsAppLinkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
whatsAppLinkCodeSchema.index({ userId: 1, usedAt: 1, expiresAt: -1 });

export type WhatsAppLinkCodeDoc =
  InferSchemaType<typeof whatsAppLinkCodeSchema> & {
    _id: Schema.Types.ObjectId;
  };

export const WhatsAppLinkCode = model(
  'WhatsAppLinkCode',
  whatsAppLinkCodeSchema,
);
