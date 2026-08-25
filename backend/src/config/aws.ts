import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env.js';
import { HttpError } from '../middleware/errorHandler.js';

let cached: S3Client | null = null;

/**
 * Return true only when all four S3 env vars are set. Everywhere the caller
 * needs S3 must gate on this so the app boots and runs without the bucket
 * configured (unit tests, first-time contributors, etc.).
 */
export function isS3Configured(): boolean {
  return Boolean(
    env.AWS_REGION && env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY,
  );
}

export function s3(): S3Client {
  if (!isS3Configured()) {
    throw new HttpError(503, 'Video storage is not configured on this server.');
  }
  if (cached) return cached;
  cached = new S3Client({
    region: env.AWS_REGION!,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  return cached;
}

export function bucket(): string {
  if (!env.AWS_S3_BUCKET) {
    throw new HttpError(503, 'Video storage bucket is not configured.');
  }
  return env.AWS_S3_BUCKET;
}

export async function presignPut(key: string, contentType: string, ttlSec = 900): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3(), cmd, { expiresIn: ttlSec });
}

export async function presignGet(key: string, ttlSec = 3600): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
  });
  return getSignedUrl(s3(), cmd, { expiresIn: ttlSec });
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
