import type { Request, Response } from 'express';
import { z } from 'zod';
import { BASE_ROLES } from '../models/Profile.js';
import {
  discoverWorkers,
  getDiscoveredWorker,
} from '../services/discovery.service.js';

const filtersSchema = z.object({
  location: z.string().trim().max(120).optional(),
  baseRole: z.enum(BASE_ROLES).optional(),
  tier: z.enum(['IN', 'DEEP', 'THERE']).optional(),
  tag: z.string().trim().max(80).optional(),
  equipment: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(20),
});

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,39}$/);

export async function workers(req: Request, res: Response) {
  const filters = filtersSchema.parse(req.query);
  res.json({ workers: await discoverWorkers(filters) });
}

export async function workerByUsername(req: Request, res: Response) {
  const username = usernameSchema.parse(req.params.username);
  res.json({ worker: await getDiscoveredWorker(username) });
}
