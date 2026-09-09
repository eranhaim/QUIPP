import { Schema, model, type InferSchemaType } from 'mongoose';

export const CHANNEL_PROVIDERS = ['web', 'greenapi'] as const;
export const CHANNEL_IDENTITY_STATUSES = ['active', 'opted_out'] as const;

const channelIdentitySchema = new Schema(
  {
    provider: { type: String, enum: CHANNEL_PROVIDERS, required: true },
    externalId: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    phone: { type: String, default: null, trim: true, index: true },
    status: {
      type: String,
      enum: CHANNEL_IDENTITY_STATUSES,
      default: 'active',
      index: true,
    },
    linkedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

channelIdentitySchema.index({ provider: 1, externalId: 1 }, { unique: true });

export type ChannelIdentityDoc = InferSchemaType<typeof channelIdentitySchema> & {
  _id: Schema.Types.ObjectId;
};
export const ChannelIdentity = model('ChannelIdentity', channelIdentitySchema);
