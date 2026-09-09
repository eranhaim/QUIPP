import { Schema, model, type InferSchemaType } from 'mongoose';

export const COURSE_ACCESS_PACK_STATUSES = ['active', 'exhausted', 'expired', 'cancelled'] as const;

const courseAccessPackSchema = new Schema(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1, max: 500 },
    assignedCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: COURSE_ACCESS_PACK_STATUSES,
      default: 'active',
      index: true,
    },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

courseAccessPackSchema.index({ operatorId: 1, status: 1, createdAt: -1 });

export type CourseAccessPackDoc = InferSchemaType<typeof courseAccessPackSchema> & {
  _id: Schema.Types.ObjectId;
};
export const CourseAccessPack = model('CourseAccessPack', courseAccessPackSchema);
