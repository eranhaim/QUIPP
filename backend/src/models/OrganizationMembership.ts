import { Schema, model, type InferSchemaType } from 'mongoose';

export const ORGANIZATION_ROLES = ['owner', 'admin', 'manager'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const MEMBERSHIP_STATUSES = ['active', 'inactive'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

const organizationMembershipSchema = new Schema(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ORGANIZATION_ROLES, required: true },
    status: { type: String, enum: MEMBERSHIP_STATUSES, default: 'active', index: true },
  },
  { timestamps: true },
);

organizationMembershipSchema.index({ operatorId: 1, userId: 1 }, { unique: true });
organizationMembershipSchema.index({ userId: 1, status: 1 });

export type OrganizationMembershipDoc = InferSchemaType<
  typeof organizationMembershipSchema
> & { _id: Schema.Types.ObjectId };
export const OrganizationMembership = model(
  'OrganizationMembership',
  organizationMembershipSchema,
);
