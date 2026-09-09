import { Schema, model, type InferSchemaType } from 'mongoose';

export const ASSIGNMENT_STATUSES = ['assigned', 'in_progress', 'completed'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

const courseAssignmentSchema = new Schema(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'OperatorLocation',
      default: null,
      index: true,
    },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: 'assigned', index: true },
    assignedAt: { type: Date, default: () => new Date() },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

courseAssignmentSchema.index(
  { operatorId: 1, workerId: 1, courseId: 1 },
  { unique: true },
);
courseAssignmentSchema.index({ operatorId: 1, status: 1, locationId: 1 });

export type CourseAssignmentDoc = InferSchemaType<typeof courseAssignmentSchema> & {
  _id: Schema.Types.ObjectId;
};
export const CourseAssignment = model('CourseAssignment', courseAssignmentSchema);
