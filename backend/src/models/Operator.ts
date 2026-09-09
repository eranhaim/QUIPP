import { Schema, model, type InferSchemaType } from 'mongoose';

const operatorSchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true, maxlength: 160 },
    businessType: { type: String, required: true, trim: true, maxlength: 100 },
    staffSize: { type: Number, required: true, min: 0 },
    hqLocation: { type: String, required: true, trim: true, maxlength: 200 },
    logoUrl: { type: String, default: null, trim: true },
    onboardingCompletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

operatorSchema.index({ companyName: 1 });

export type OperatorDoc = InferSchemaType<typeof operatorSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Operator = model('Operator', operatorSchema);
