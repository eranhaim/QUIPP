import { Schema, model, type InferSchemaType } from 'mongoose';

export const SUPPLIER_STATUSES = ['active', 'suspended'] as const;

const supplierSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    companyName: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    approved: { type: Boolean, default: false, index: true },
    serviceRegions: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    websiteUrl: { type: String, default: null, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: SUPPLIER_STATUSES, default: 'active', index: true },
  },
  { timestamps: true },
);

supplierSchema.index({ approved: 1, status: 1, categories: 1, serviceRegions: 1 });

export type SupplierDoc = InferSchemaType<typeof supplierSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Supplier = model('Supplier', supplierSchema);
