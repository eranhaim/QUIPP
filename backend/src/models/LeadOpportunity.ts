import { Schema, model, type InferSchemaType } from 'mongoose';

export const LEAD_STATUSES = ['draft', 'open', 'matched', 'closed', 'cancelled'] as const;
export const LEAD_URGENCIES = ['low', 'normal', 'high'] as const;
export const LEAD_SHAREABLE_FIELDS = [
  'category',
  'city',
  'region',
  'budgetMinCents',
  'budgetMaxCents',
  'currency',
  'requirements',
  'urgency',
  'requesterEmail',
] as const;

const leadOpportunitySchema = new Schema(
  {
    requesterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    operatorId: { type: Schema.Types.ObjectId, ref: 'Operator', default: null, index: true },
    category: { type: String, required: true, trim: true, index: true },
    city: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true, index: true },
    budgetMinCents: { type: Number, default: null, min: 0 },
    budgetMaxCents: { type: Number, default: null, min: 0 },
    currency: { type: String, required: true, default: 'USD', uppercase: true, trim: true },
    requirements: { type: String, required: true, trim: true, maxlength: 5_000 },
    urgency: { type: String, enum: LEAD_URGENCIES, default: 'normal' },
    consentedFields: [{ type: String, enum: LEAD_SHAREABLE_FIELDS }],
    status: { type: String, enum: LEAD_STATUSES, default: 'open', index: true },
    expiresAt: { type: Date, required: true, index: true },
    consentedAt: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
    acceptedProposalId: { type: Schema.Types.ObjectId, ref: 'LeadProposal', default: null },
    acceptedSupplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
    identityReleasedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

leadOpportunitySchema.index({ status: 1, category: 1, region: 1, expiresAt: 1 });

export type LeadOpportunityDoc = InferSchemaType<typeof leadOpportunitySchema> & {
  _id: Schema.Types.ObjectId;
};
export const LeadOpportunity = model('LeadOpportunity', leadOpportunitySchema);
