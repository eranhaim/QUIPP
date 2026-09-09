import type { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/endorsement.service.js';

const requestSchema = z.object({
  operatorId: z.string().min(1),
  thereCourseId: z.string().min(1),
  deepCredentialId: z.string().min(1),
  statement: z.string().trim().min(10).max(2000),
});

const approveSchema = z.object({
  reviewNotes: z.string().trim().max(1000).optional(),
});

const rejectSchema = z.object({
  reviewNotes: z.string().trim().min(1).max(1000),
});

export async function create(req: Request, res: Response) {
  const input = requestSchema.parse(req.body);
  const endorsement = await service.requestEndorsement(req.auth!.sub, input);
  res.status(201).json({ endorsement });
}

export async function listMine(req: Request, res: Response) {
  const endorsements = await service.listWorkerEndorsements(req.auth!.sub);
  res.json({ endorsements });
}

export async function listForOperator(req: Request, res: Response) {
  const endorsements = await service.listOperatorEndorsements(req.auth!.sub);
  res.json({ endorsements });
}

export async function approve(req: Request, res: Response) {
  const { reviewNotes } = approveSchema.parse(req.body ?? {});
  const endorsement = await service.approveEndorsement(
    req.auth!.sub,
    req.params.id,
    reviewNotes,
  );
  res.json({ endorsement });
}

export async function reject(req: Request, res: Response) {
  const { reviewNotes } = rejectSchema.parse(req.body ?? {});
  const endorsement = await service.rejectEndorsement(
    req.auth!.sub,
    req.params.id,
    reviewNotes,
  );
  res.json({ endorsement });
}
