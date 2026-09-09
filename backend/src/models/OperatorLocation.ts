import { Schema, model, type InferSchemaType } from 'mongoose';

const operatorLocationSchema = new Schema(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    address: { type: String, default: null, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    timezone: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true },
);

operatorLocationSchema.index({ operatorId: 1, code: 1 }, { unique: true });
operatorLocationSchema.index({ operatorId: 1, name: 1 });

export type OperatorLocationDoc = InferSchemaType<typeof operatorLocationSchema> & {
  _id: Schema.Types.ObjectId;
};
export const OperatorLocation = model('OperatorLocation', operatorLocationSchema);
