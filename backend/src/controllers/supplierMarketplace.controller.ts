import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  listSupplierLeads,
  listSupplierProposals,
  submitProposal,
} from '../services/lead.service.js';

const proposalSchema = z
  .object({
    message: z.string().trim().min(10).max(5_000),
    priceEstimateMinCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    priceEstimateMaxCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    currency: z.string().trim().length(3).default('USD'),
  })
  .refine(
    (value) =>
      value.priceEstimateMinCents == null ||
      value.priceEstimateMaxCents == null ||
      value.priceEstimateMinCents <= value.priceEstimateMaxCents,
    { message: 'Minimum estimate cannot exceed maximum estimate' },
  );

export async function leads(req: Request, res: Response) {
  res.json({ leads: await listSupplierLeads(req.auth!.sub) });
}

export async function propose(req: Request, res: Response) {
  res.status(201).json({
    proposal: await submitProposal(
      req.auth!.sub,
      req.params.id,
      proposalSchema.parse(req.body),
    ),
  });
}

export async function proposals(req: Request, res: Response) {
  res.json({ proposals: await listSupplierProposals(req.auth!.sub) });
}
