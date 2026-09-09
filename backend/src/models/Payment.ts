import { Schema, model, type InferSchemaType } from 'mongoose';

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired'] as const;

const paymentSchema = new Schema(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stripeCheckoutSessionId: { type: String, trim: true },
    stripePaymentIntentId: { type: String, trim: true },
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, minlength: 3, maxlength: 3 },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1, max: 500 },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: '' },
  },
  { timestamps: true },
);

paymentSchema.index(
  { stripeCheckoutSessionId: 1 },
  { unique: true, sparse: true },
);
paymentSchema.index(
  { stripePaymentIntentId: 1 },
  { unique: true, sparse: true },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Payment = model('Payment', paymentSchema);
