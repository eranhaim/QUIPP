import { Schema, model, Types } from 'mongoose';

export const EMAIL_TOKEN_PURPOSES = ['verify_email', 'password_reset'] as const;
export type EmailTokenPurpose = (typeof EMAIL_TOKEN_PURPOSES)[number];

const emailTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    purpose: { type: String, enum: EMAIL_TOKEN_PURPOSES, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

emailTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


export const EmailToken = model('EmailToken', emailTokenSchema);
