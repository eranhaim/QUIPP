import { Schema, model, type InferSchemaType } from 'mongoose';

export const INTRODUCTION_STATUSES = [
  'pending',
  'connected',
  'declined',
  'cancelled',
  'expired',
  'reported',
] as const;
export const INTRODUCTION_CHANNELS = ['email'] as const;

const introductionSchema = new Schema(
  {
    requesterUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    approvedChannel: {
      type: String,
      enum: INTRODUCTION_CHANNELS,
      required: true,
      default: 'email',
    },
    status: {
      type: String,
      enum: INTRODUCTION_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    requesterConsentedAt: { type: Date, required: true, default: () => new Date() },
    candidateConsentedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
    outcome: { type: String, default: null, trim: true, maxlength: 500 },
    helpful: { type: Boolean, default: null },
    reportReason: { type: String, default: null, trim: true, maxlength: 500 },
    reportedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

introductionSchema.index({ requesterUserId: 1, status: 1, createdAt: -1 });
introductionSchema.index({ candidateUserId: 1, status: 1, createdAt: -1 });
introductionSchema.index(
  { requesterUserId: 1, candidateUserId: 1, purpose: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
    name: 'one_pending_introduction_per_purpose',
  },
);

export type IntroductionDoc = InferSchemaType<typeof introductionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Introduction = model('Introduction', introductionSchema);
