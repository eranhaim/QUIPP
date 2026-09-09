import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  acceptIntroduction,
  cancelIntroduction,
  createIntroduction,
  declineIntroduction,
  getMyIntroductions,
  recordIntroductionOutcome,
  reportIntroduction,
} from '../services/introduction.service.js';

const createSchema = z.object({
  candidateUsername: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,39}$/),
  purpose: z.string().trim().min(10).max(500),
  approvedChannel: z.literal('email'),
});
const reportSchema = z.object({ reason: z.string().trim().min(3).max(500) });
const outcomeSchema = z.object({
  helpful: z.boolean(),
  outcome: z.string().trim().max(500).optional(),
});

export async function create(req: Request, res: Response) {
  const body = createSchema.parse(req.body);
  const introduction = await createIntroduction({
    requesterUserId: req.auth!.sub,
    ...body,
  });
  res.status(201).json({ introduction });
}

export async function me(req: Request, res: Response) {
  res.json(await getMyIntroductions(req.auth!.sub));
}

export async function accept(req: Request, res: Response) {
  res.json({ introduction: await acceptIntroduction(req.params.id, req.auth!.sub) });
}

export async function decline(req: Request, res: Response) {
  res.json({ introduction: await declineIntroduction(req.params.id, req.auth!.sub) });
}

export async function cancel(req: Request, res: Response) {
  res.json({ introduction: await cancelIntroduction(req.params.id, req.auth!.sub) });
}

export async function report(req: Request, res: Response) {
  const { reason } = reportSchema.parse(req.body);
  res.json({ introduction: await reportIntroduction(req.params.id, req.auth!.sub, reason) });
}

export async function outcome(req: Request, res: Response) {
  const body = outcomeSchema.parse(req.body);
  res.json({
    introduction: await recordIntroductionOutcome(req.params.id, req.auth!.sub, body),
  });
}
