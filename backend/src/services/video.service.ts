import crypto from 'node:crypto';
import { Video, type VideoDoc } from '../models/Video.js';
import { HttpError } from '../middleware/errorHandler.js';
import { deleteObject, isS3Configured, presignGet, presignPut } from '../config/aws.js';

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export interface PublicVideo {
  id: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSec: number | null;
  status: 'pending' | 'ready' | 'failed';
  createdAt: string;
}

function toPublic(v: VideoDoc): PublicVideo {
  return {
    id: String(v._id),
    title: v.title,
    originalFilename: v.originalFilename,
    mimeType: v.mimeType,
    sizeBytes: v.sizeBytes,
    durationSec: v.durationSec ?? null,
    status: v.status as PublicVideo['status'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: (v as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export interface CreateDraftInput {
  uploadedBy: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreateDraftResult {
  video: PublicVideo;
  uploadUrl: string;
  s3Key: string;
}

export async function createDraft(input: CreateDraftInput): Promise<CreateDraftResult> {
  if (!isS3Configured()) {
    throw new HttpError(503, 'Video storage is not configured on this server.');
  }
  if (!ALLOWED_MIMES.has(input.mimeType)) {
    throw new HttpError(400, `Unsupported video type: ${input.mimeType}`, {
      allowed: Array.from(ALLOWED_MIMES),
    });
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, `File must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes`);
  }

  const extGuess = input.originalFilename.split('.').pop()?.toLowerCase() ?? 'mp4';
  const safeExt = /^[a-z0-9]{1,5}$/.test(extGuess) ? extGuess : 'mp4';
  const s3Key = `videos/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${safeExt}`;

  const doc = await Video.create({
    title: input.title.trim(),
    s3Key,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    status: 'pending',
    uploadedBy: input.uploadedBy,
  });

  const uploadUrl = await presignPut(s3Key, input.mimeType, 900);
  return {
    video: toPublic(doc as unknown as VideoDoc),
    uploadUrl,
    s3Key,
  };
}

export async function markReady(id: string, durationSec?: number): Promise<PublicVideo> {
  const update: Record<string, unknown> = { status: 'ready' };
  if (typeof durationSec === 'number' && durationSec > 0) {
    update.durationSec = Math.round(durationSec);
  }
  const doc = await Video.findByIdAndUpdate(id, update, { new: true });
  if (!doc) throw new HttpError(404, 'Video not found');
  return toPublic(doc as unknown as VideoDoc);
}

export async function listVideos(): Promise<PublicVideo[]> {
  const docs = await Video.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => toPublic(d as unknown as VideoDoc));
}

export async function getVideo(id: string): Promise<PublicVideo> {
  const doc = await Video.findById(id).lean();
  if (!doc) throw new HttpError(404, 'Video not found');
  return toPublic(doc as unknown as VideoDoc);
}

/**
 * Return a short-lived signed URL for playback. Callers must always fetch this
 * via the API — the raw `s3Key` never leaves the server.
 */
export async function getPlaybackUrl(id: string): Promise<{ url: string; expiresIn: number }> {
  const doc = await Video.findById(id).lean();
  if (!doc) throw new HttpError(404, 'Video not found');
  if (doc.status !== 'ready') {
    throw new HttpError(409, 'Video is not ready for playback');
  }
  const ttl = 3600;
  const url = await presignGet(doc.s3Key, ttl);
  return { url, expiresIn: ttl };
}

export async function removeVideo(id: string): Promise<void> {
  const doc = await Video.findById(id);
  if (!doc) throw new HttpError(404, 'Video not found');
  if (isS3Configured()) {
    try {
      await deleteObject(doc.s3Key);
    } catch {
      // Non-fatal: the DB row is still removed. S3 object may need manual cleanup.
    }
  }
  await doc.deleteOne();
}
