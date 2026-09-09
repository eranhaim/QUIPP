import { Schema, model, type InferSchemaType } from 'mongoose';
import { TAG_NAMES } from './TechnologyTag.js';

export const COURSE_TIERS = ['IN', 'DEEP', 'THERE'] as const;
export type CourseTier = (typeof COURSE_TIERS)[number];

export const COURSE_STATUSES = [
  'draft',
  'submitted',
  'changes_requested',
  'approved',
  'published',
  'coming_soon',
] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export const COURSE_OWNER_TYPES = ['quipp', 'operator'] as const;
export const COURSE_VISIBILITIES = ['public', 'organization'] as const;
export const COURSE_REVIEW_STATUSES = [
  'draft',
  'submitted',
  'changes_requested',
  'approved',
] as const;

export const COURSE_PART_TYPES = [
  'real_world',
  'knowledge',
  'video',
  'mastery_check',
  'credential',
] as const;
export type CoursePartType = (typeof COURSE_PART_TYPES)[number];

const masteryQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: (v: string[]) => v.length >= 2 },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '' },
  },
  { _id: false },
);

const coursePartSchema = new Schema(
  {
    partId: { type: String, required: true },
    type: { type: String, required: true, enum: COURSE_PART_TYPES },
    title: { type: String, required: true },
    duration: { type: String, default: '' },
    content: { type: String, default: '' },
    topics: { type: [String], default: [] },
    questions: { type: [masteryQuestionSchema], default: [] },
    videoId: { type: Schema.Types.ObjectId, ref: 'Video', default: null },
    /**
     * Fallback direct video URL for seed content that has no S3 upload.
     * Real admin-uploaded videos always use `videoId`. When both are set,
     * `videoId` (presigned S3) wins.
     */
    directVideoUrl: { type: String, default: null },
  },
  { _id: false },
);

const courseSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true },
    techFocus: { type: String, required: true },
    tagName: { type: String, required: true, enum: TAG_NAMES, index: true },
    tier: { type: String, required: true, enum: COURSE_TIERS },
    duration: { type: Number, default: 30 },
    description: { type: String, default: '' },
    provider: { type: String, default: 'quipp' },
    isManufacturer: { type: Boolean, default: false },
    equipmentName: { type: String, default: null },
    passMark: { type: Number, default: 80, min: 0, max: 100 },
    retakeCooldownHours: { type: Number, default: 24, min: 0 },
    techScoreContribution: { type: Number, default: 5, min: 0 },
    status: { type: String, enum: COURSE_STATUSES, default: 'published', index: true },
    priceCents: { type: Number, default: 0, min: 0 },
    stripePriceId: { type: String, trim: true },
    ownerType: { type: String, enum: COURSE_OWNER_TYPES, default: 'quipp', index: true },
    ownerOperatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      default: null,
      index: true,
    },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    visibility: { type: String, enum: COURSE_VISIBILITIES, default: 'public', index: true },
    reviewStatus: {
      type: String,
      enum: COURSE_REVIEW_STATUSES,
      default: 'approved',
      index: true,
    },
    reviewNotes: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    approvedVersion: { type: Number, default: 0, min: 0 },
    technicalCompetencies: { type: [String], default: [] },
    parts: { type: [coursePartSchema], default: [] },
  },
  { timestamps: true },
);

export type CourseDoc = InferSchemaType<typeof courseSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Course = model('Course', courseSchema);
