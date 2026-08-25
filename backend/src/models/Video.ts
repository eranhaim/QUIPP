import { Schema, model, type InferSchemaType } from 'mongoose';

export const VIDEO_STATUSES = ['pending', 'ready', 'failed'] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

const videoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    s3Key: { type: String, required: true, unique: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    durationSec: { type: Number, default: null, min: 0 },
    posterS3Key: { type: String, default: null },
    status: { type: String, enum: VIDEO_STATUSES, default: 'pending', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

export type VideoDoc = InferSchemaType<typeof videoSchema> & {
  _id: Schema.Types.ObjectId;
};
export const Video = model('Video', videoSchema);
