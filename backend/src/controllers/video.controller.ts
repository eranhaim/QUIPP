import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createDraft,
  getPlaybackUrl,
  listVideos,
  markReady,
  removeVideo,
} from '../services/video.service.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  originalFilename: z.string().min(1).max(300),
  mimeType: z.string().min(1).max(80),
  sizeBytes: z.number().int().positive(),
});

export async function list(_req: Request, res: Response) {
  const videos = await listVideos();
  res.json({ videos });
}

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const uploadedBy = req.auth!.sub;
  const result = await createDraft({ ...input, uploadedBy });
  res.status(201).json(result);
}

const confirmSchema = z.object({
  durationSec: z.number().positive().optional(),
});

export async function confirm(req: Request, res: Response) {
  const { durationSec } = confirmSchema.parse(req.body ?? {});
  const video = await markReady(req.params.id, durationSec);
  res.json({ video });
}

export async function remove(req: Request, res: Response) {
  await removeVideo(req.params.id);
  res.status(204).end();
}

export async function playback(req: Request, res: Response) {
  const url = await getPlaybackUrl(req.params.id);
  res.json(url);
}
