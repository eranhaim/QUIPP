import { Schema, model, type InferSchemaType } from 'mongoose';

export const SEAT_ASSIGNMENT_STATUSES = ['assigned', 'consumed', 'revoked'] as const;

const seatAssignmentSchema = new Schema(
  {
    packId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseAccessPack',
      required: true,
      index: true,
    },
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: SEAT_ASSIGNMENT_STATUSES,
      default: 'assigned',
      index: true,
    },
    assignedAt: { type: Date, default: () => new Date() },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

seatAssignmentSchema.index(
  { operatorId: 1, courseId: 1, workerId: 1 },
  { unique: true },
);
seatAssignmentSchema.index({ packId: 1, status: 1 });

export type SeatAssignmentDoc = InferSchemaType<typeof seatAssignmentSchema> & {
  _id: Schema.Types.ObjectId;
};
export const SeatAssignment = model('SeatAssignment', seatAssignmentSchema);
