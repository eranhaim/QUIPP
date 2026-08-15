import { Schema, model, type InferSchemaType } from 'mongoose';

export const APP_ROLES = ['worker', 'operator', 'manufacturer', 'admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: false, select: false },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    emailVerifiedAt: { type: Date, default: null },
    roles: {
      type: [String],
      enum: APP_ROLES,
      default: ['worker'],
    },
    googleId: { type: String, default: null, index: true, sparse: true },
    facebookId: { type: String, default: null, index: true, sparse: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };
export const User = model('User', userSchema);
