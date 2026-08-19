import { Schema, model, type InferSchemaType } from 'mongoose';
import { TAG_NAMES } from './TechnologyTag.js';
import { COURSE_TIERS } from './Course.js';

export const CREDENTIAL_STATUSES = ['active', 'update_available'] as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

const credentialSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true, index: true },
    courseName: { type: String, required: true },
    tier: { type: String, required: true, enum: COURSE_TIERS },
    tagName: { type: String, required: true, enum: TAG_NAMES },
    provider: { type: String, required: true },
    isManufacturer: { type: Boolean, default: false },
    techFocus: { type: String, default: '' },
    earnedDate: { type: Date, default: () => new Date() },
    verificationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    quizScore: { type: Number, default: null, min: 0, max: 100 },
    skillsDemonstrated: { type: [String], default: [] },
    techScoreContribution: { type: Number, default: 5 },
    status: { type: String, enum: CREDENTIAL_STATUSES, default: 'active' },
  },
  { timestamps: true },
);

credentialSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });

export type CredentialDoc = InferSchemaType<typeof credentialSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Credential = model('Credential', credentialSchema);
