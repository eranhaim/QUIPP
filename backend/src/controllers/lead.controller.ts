import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  LEAD_SHAREABLE_FIELDS,
  LEAD_URGENCIES,
} from '../models/LeadOpportunity.js';
import {
  acceptProposal,
  cancelLead,
  createLead,
  listMyLeads,
  listMyLeadProposals,
} from '../services/lead.service.js';

export const createLeadSchema = z
  .object({
    consent: z.literal(true, {
      errorMap: () => ({ message: 'Explicit consent is required' }),
    }),
    operatorId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    category: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(120),
    region: z.string().trim().min(2).max(120),
    budgetMinCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    budgetMaxCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    currency: z.string().trim().length(3).default('USD'),
    requirements: z.string().trim().min(5).max(5_000),
    urgency: z.enum(LEAD_URGENCIES).default('normal'),
    consentedFields: z.array(z.enum(LEAD_SHAREABLE_FIELDS)).min(1),
  })
  .strict();

export async function create(req: Request, res: Response) {
  const { consent: _consent, ...input } = createLeadSchema.parse(req.body);
  res.status(201).json({ lead: await createLead(req.auth!.sub, input) });
}

export async function mine(req: Request, res: Response) {
  res.json({ leads: await listMyLeads(req.auth!.sub) });
}

export async function cancel(req: Request, res: Response) {
  res.json({ lead: await cancelLead(req.auth!.sub, req.params.id) });
}

export async function proposals(req: Request, res: Response) {
  res.json({
    proposals: await listMyLeadProposals(req.auth!.sub, req.params.leadId),
  });
}

export async function accept(req: Request, res: Response) {
  res.json({
    proposal: await acceptProposal(
      req.auth!.sub,
      req.params.leadId,
      req.params.proposalId,
    ),
  });
}
