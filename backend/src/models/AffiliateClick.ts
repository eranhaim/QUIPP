import { Schema, model, type InferSchemaType } from 'mongoose';

const affiliateClickSchema = new Schema(
  {
    offerId: { type: Schema.Types.ObjectId, ref: 'AffiliateOffer', default: null, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    principalKey: { type: String, required: true, trim: true, index: true },
    channel: { type: String, required: true, enum: ['web', 'greenapi'], default: 'web' },
    clickedAt: { type: Date, default: () => new Date(), index: true },
    conversionMetadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: false },
);

export type AffiliateClickDoc = InferSchemaType<typeof affiliateClickSchema> & {
  _id: Schema.Types.ObjectId;
};
export const AffiliateClick = model('AffiliateClick', affiliateClickSchema);
