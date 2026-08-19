import { Schema, model, type InferSchemaType } from 'mongoose';

export const ENROLLMENT_STATUSES = ['in_progress', 'completed', 'failed'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_SOURCE_TYPES = [
  'free',
  'paid',
  'library',
  'manufacturer_credit',
] as const;
export type EnrollmentSourceType = (typeof ENROLLMENT_SOURCE_TYPES)[number];

const enrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: 'in_progress',
      index: true,
    },
    startedAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
    progressPct: { type: Number, default: 0, min: 0, max: 100 },
    lastAttemptAt: { type: Date, default: null },
    lastScore: { type: Number, default: null, min: 0, max: 100 },
    sourceType: {
      type: String,
      enum: ENROLLMENT_SOURCE_TYPES,
      default: 'free',
    },
  },
  { timestamps: true },
);

enrollmentSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });

export type CourseEnrollmentDoc = InferSchemaType<typeof enrollmentSchema> & {
  _id: Schema.Types.ObjectId;
};
export const CourseEnrollment = model('CourseEnrollment', enrollmentSchema);
