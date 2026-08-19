import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  getMyProfile,
  getProfileByUsername,
  updateMyProfile,
} from '../services/profile.service.js';
import { BASE_ROLES } from '../models/Profile.js';
import { VISIBILITY_STATUSES } from '../models/Profile.js';
import { HttpError } from '../middleware/errorHandler.js';

const updateSchema = z.object({
  baseRole: z.enum(BASE_ROLES).nullable().optional(),
  specialty: z.string().trim().max(120).nullable().optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  location: z.string().trim().max(120).nullable().optional(),
  visibilityStatus: z.enum(VISIBILITY_STATUSES).optional(),
});

export async function me(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const profile = await getMyProfile(req.auth.sub);
  res.json({ profile });
}

export async function byUsername(req: Request, res: Response) {
  const profile = await getProfileByUsername(req.params.username);
  res.json({ profile });
}

export async function updateMe(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const body = updateSchema.parse(req.body);
  const profile = await updateMyProfile(req.auth.sub, body);
  res.json({ profile });
}
