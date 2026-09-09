import { Schema, model, type InferSchemaType } from 'mongoose';

export const PROPOSAL_STATUSES = ['submitted', 'accepted', 'declined', 'withdrawn'] as const;

const leadProposalSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'LeadOpportunity', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 5_000 },
    priceEstimateMinCents: { type: Number, default: null, min: 0 },
    priceEstimateMaxCents: { type: Number, default: null, min: 0 },
    currency: { type: String, required: true, default: 'USD', uppercase: true, trim: true },
    status: { type: String, enum: PROPOSAL_STATUSES, default: 'submitted', index: true },
    submittedAt: { type: Date, default: () => new Date() },
    acceptedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
  },
  { timestamps: true },
);

leadProposalSchema.index({ leadId: 1, supplierId: 1 }, { unique: true });

export type LeadProposalDoc = InferSchemaType<typeof leadProposalSchema> & {
  _id: Schema.Types.ObjectId;
};
export const LeadProposal = model('LeadProposal', leadProposalSchema);
