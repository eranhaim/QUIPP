import { Schema, model, type InferSchemaType } from 'mongoose';

export const CONSENT_PURPOSES = [
  'matching',
  'introduction',
  'contact_share',
  'lead_share',
  'marketing',
  'analytics',
] as const;
export const CONSENT_STATUSES = ['granted', 'withdrawn'] as const;

const consentRecordSchema = new Schema(
  {
    principalKey: { type: String, required: true, trim: true, index: true },
    purpose: { type: String, enum: CONSENT_PURPOSES, required: true },
    status: { type: String, enum: CONSENT_STATUSES, required: true },
    scope: { type: Schema.Types.Mixed, default: null },
    grantedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
  },
  { timestamps: true },
);

consentRecordSchema.index(
  { principalKey: 1, purpose: 1, 'scope.context': 1 },
  { unique: true },
);

export type ConsentRecordDoc = InferSchemaType<typeof consentRecordSchema> & {
  _id: Schema.Types.ObjectId;
};
export const ConsentRecord = model('ConsentRecord', consentRecordSchema);
