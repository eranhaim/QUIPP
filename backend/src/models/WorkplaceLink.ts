import { Schema, model, type InferSchemaType } from 'mongoose';

export const WORKPLACE_LINK_STATUSES = [
  'pending',
  'active',
  'declined',
  'unlinked',
] as const;
export type WorkplaceLinkStatus = (typeof WORKPLACE_LINK_STATUSES)[number];

const workplaceLinkSchema = new Schema(
  {
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
    status: {
      type: String,
      enum: WORKPLACE_LINK_STATUSES,
      default: 'pending',
      index: true,
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    operatorVisibilityEndsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

workplaceLinkSchema.index({ workerId: 1, operatorId: 1 }, { unique: true });
workplaceLinkSchema.index({ operatorId: 1, status: 1, locationId: 1 });

export type WorkplaceLinkDoc = InferSchemaType<typeof workplaceLinkSchema> & {
  _id: Schema.Types.ObjectId;
};
export const WorkplaceLink = model('WorkplaceLink', workplaceLinkSchema);
