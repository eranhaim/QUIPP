import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  listMyDeclarations,
  declareEquipment,
  bulkDeclare,
  removeDeclaration,
} from '../services/techDeclaration.service.js';
import { TAG_NAMES } from '../models/TechnologyTag.js';
import { HttpError } from '../middleware/errorHandler.js';

const declareSchema = z.object({
  equipmentName: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).nullable().optional(),
  tagName: z.enum(TAG_NAMES).nullable().optional(),
});

const bulkSchema = z.object({
  equipmentNames: z.array(z.string().trim().min(1).max(120)).min(1).max(50),
});

export async function list(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const declarations = await listMyDeclarations(req.auth.sub);
  res.json({ declarations });
}

export async function create(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const body = declareSchema.parse(req.body);
  const declaration = await declareEquipment(req.auth.sub, body);
  res.status(201).json({ declaration });
}

export async function bulk(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const body = bulkSchema.parse(req.body);
  const declarations = await bulkDeclare(req.auth.sub, body.equipmentNames);
  res.json({ declarations });
}

export async function remove(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  await removeDeclaration(req.auth.sub, req.params.id);
  res.status(204).end();
}
