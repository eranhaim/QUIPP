import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/deepSubmission.service.js';

const submitSchema = z.object({
  inCredentialId: z.string().min(1),
  supervisorName: z.string().min(1).max(120),
  supervisorEmail: z.string().email(),
  supervisorText: z.string().min(20).max(2000),
});

export async function create(req: Request, res: Response) {
  const input = submitSchema.parse(req.body);
  const submission = await service.submit({
    userId: req.auth!.sub,
    ...input,
  });
  res.status(201).json({ submission });
}

export async function listMine(req: Request, res: Response) {
  const submissions = await service.listMine(req.auth!.sub);
  res.json({ submissions });
}

export async function listPending(_req: Request, res: Response) {
  const submissions = await service.listPending();
  res.json({ submissions });
}

const reviewSchema = z.object({ reviewNotes: z.string().max(1000).optional() });

export async function approve(req: Request, res: Response) {
  const { reviewNotes } = reviewSchema.parse(req.body ?? {});
  const submission = await service.approve(req.params.id, req.auth!.sub, reviewNotes);
  res.json({ submission });
}

export async function reject(req: Request, res: Response) {
  const { reviewNotes } = reviewSchema.parse(req.body ?? {});
  const submission = await service.reject(req.params.id, req.auth!.sub, reviewNotes);
  res.json({ submission });
}
