import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  getProduct,
  recordAffiliateClick,
  searchProducts,
} from '../services/marketplace.service.js';

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(100).optional(),
  region: z.string().trim().max(120).optional(),
  budget: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function list(req: Request, res: Response) {
  const query = searchSchema.parse(req.query);
  res.json({
    products: await searchProducts({
      q: query.q,
      category: query.category,
      region: query.region,
      budgetCents: query.budget,
      limit: query.limit,
    }),
  });
}

export async function detail(req: Request, res: Response) {
  res.json({ product: await getProduct(req.params.slug) });
}

export async function click(req: Request, res: Response) {
  const destination = await recordAffiliateClick({
    offerId: req.params.id,
    userId: req.auth!.sub,
    principalKey: `user:${req.auth!.sub}`,
    channel: 'web',
  });
  if (req.query.return === 'destination') {
    res.json({ destination });
    return;
  }
  res.redirect(302, destination);
}
