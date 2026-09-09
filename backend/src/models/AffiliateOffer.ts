import { Schema, model, type InferSchemaType } from 'mongoose';

export const COMMISSION_TYPES = ['percentage', 'fixed', 'none', 'unknown'] as const;

const affiliateOfferSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    destinationUrl: { type: String, required: true, trim: true },
    disclosureLabel: { type: String, required: true, trim: true, maxlength: 300 },
    commissionType: { type: String, enum: COMMISSION_TYPES, default: 'unknown' },
    commissionAmount: { type: Number, default: null, min: 0, select: false },
    active: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true },
);

affiliateOfferSchema.index({ productId: 1, active: 1 });

export type AffiliateOfferDoc = InferSchemaType<typeof affiliateOfferSchema> & {
  _id: Schema.Types.ObjectId;
};
export const AffiliateOffer = model('AffiliateOffer', affiliateOfferSchema);
