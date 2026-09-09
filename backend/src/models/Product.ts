import { Schema, model, type InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 10_000 },
    specifications: { type: Map, of: String, default: {} },
    regions: { type: [String], default: [] },
    priceMinCents: { type: Number, default: null, min: 0 },
    priceMaxCents: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    sourceUpdatedAt: { type: Date, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

productSchema.index({ active: 1, category: 1, regions: 1 });
productSchema.index({ name: 'text', brand: 'text', model: 'text', description: 'text' });

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Product = model('Product', productSchema);
