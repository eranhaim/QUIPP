import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createDraft,
  listVideosForUser,
  markOwnedVideoReady,
  removeOwnedVideo,
} from '../services/video.service.js';

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  originalFilename: z.string().trim().min(1).max(300),
  mimeType: z.string().trim().min(1).max(80),
  sizeBytes: z.number().int().positive(),
});

const confirmSchema = z.object({
  durationSec: z.number().positive().optional(),
});

export async function list(req: Request, res: Response) {
  res.json({ videos: await listVideosForUser(req.auth!.sub) });
}

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const result = await createDraft({ ...input, uploadedBy: req.auth!.sub });
  res.status(201).json(result);
}

export async function confirm(req: Request, res: Response) {
  const { durationSec } = confirmSchema.parse(req.body ?? {});
  const video = await markOwnedVideoReady(req.params.id, req.auth!.sub, durationSec);
  res.json({ video });
}

export async function remove(req: Request, res: Response) {
  await removeOwnedVideo(req.params.id, req.auth!.sub);
  res.status(204).end();
}
