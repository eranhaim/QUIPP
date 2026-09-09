import { Schema, Types, model, type InferSchemaType } from 'mongoose';

export const ENDORSEMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type EndorsementStatus = (typeof ENDORSEMENT_STATUSES)[number];

const endorsementSchema = new Schema(
  {
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    operatorId: { type: Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    thereCourseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    deepCredentialId: {
      type: Schema.Types.ObjectId,
      ref: 'Credential',
      required: true,
      index: true,
    },
    statement: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ENDORSEMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    requestedAt: { type: Date, default: () => new Date(), index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

endorsementSchema.index(
  { workerId: 1, operatorId: 1, thereCourseId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
    name: 'one_pending_endorsement_per_worker_operator_course',
  },
);
endorsementSchema.index({ operatorId: 1, status: 1, requestedAt: -1 });
endorsementSchema.index({ workerId: 1, status: 1, requestedAt: -1 });

export type EndorsementDoc = InferSchemaType<typeof endorsementSchema> & {
  _id: Types.ObjectId;
};

export const Endorsement = model('Endorsement', endorsementSchema);
