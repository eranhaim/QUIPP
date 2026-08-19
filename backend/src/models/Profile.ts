import { Schema, model, type InferSchemaType } from 'mongoose';

export const VISIBILITY_STATUSES = ['open', 'employed', 'private'] as const;
export type VisibilityStatus = (typeof VISIBILITY_STATUSES)[number];

export const BASE_ROLES = ['Kitchen', 'Bar', 'Floor', 'Management', 'Ownership', 'Other'] as const;
export type BaseRole = (typeof BASE_ROLES)[number];

const profileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
      match: /^[a-z0-9][a-z0-9-]*$/,
    },
    avatarUrl: { type: String, default: null },
    techProficiencyScore: { type: Number, default: 0, min: 0, max: 100 },
    visibilityStatus: {
      type: String,
      enum: VISIBILITY_STATUSES,
      default: 'open',
    },
    baseRole: { type: String, enum: [...BASE_ROLES, null], default: null },
    techRole: { type: String, default: null, trim: true },
    specialty: { type: String, default: null, trim: true, maxlength: 120 },
    yearsExperience: { type: Number, default: 0, min: 0, max: 80 },
    location: { type: String, default: null, trim: true, maxlength: 120 },
  },
  { timestamps: true },
);

export type ProfileDoc = InferSchemaType<typeof profileSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Profile = model('Profile', profileSchema);
