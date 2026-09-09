import { Schema, model, type InferSchemaType } from 'mongoose';

export const QUIPPY_AUDIENCES = ['unknown', 'worker', 'operator', 'supplier'] as const;
export const FACT_SOURCES = ['user', 'channel', 'system', 'inferred'] as const;
export const FACT_SENSITIVITIES = ['public', 'personal', 'sensitive'] as const;

const factSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    source: { type: String, enum: FACT_SOURCES, required: true },
    confidence: { type: Number, default: 1, min: 0, max: 1 },
    sensitivity: {
      type: String,
      enum: FACT_SENSITIVITIES,
      default: 'personal',
    },
    expiresAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: true },
);

const quippyProfileSchema = new Schema(
  {
    principalKey: { type: String, required: true, unique: true, trim: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      unique: true,
      sparse: true,
    },
    audience: { type: String, enum: QUIPPY_AUDIENCES, default: 'unknown' },
    language: { type: String, default: 'en', trim: true, maxlength: 20 },
    onboardingStage: { type: String, default: 'new', trim: true, maxlength: 80 },
    onboardingCompletedAt: { type: Date, default: null },
    facts: { type: [factSchema], default: [] },
  },
  { timestamps: true },
);

export type QuippyProfileDoc = InferSchemaType<typeof quippyProfileSchema> & {
  _id: Schema.Types.ObjectId;
};
export const QuippyProfile = model('QuippyProfile', quippyProfileSchema);
