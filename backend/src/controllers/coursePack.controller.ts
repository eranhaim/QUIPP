import type { Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../middleware/errorHandler.js';
import {
  assignCoursePackSeat,
  checkoutCoursePack,
  listCoursePacks,
} from '../services/coursePack.service.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');

const checkoutSchema = z
  .object({
    courseId: objectId.optional(),
    courseSlug: z.string().trim().min(1).max(100).toLowerCase().optional(),
    quantity: z.number().int().min(1).max(500),
  })
  .refine((value) => Boolean(value.courseId || value.courseSlug), {
    message: 'courseId or courseSlug is required',
  });

const assignmentSchema = z.object({ workerId: objectId });

function authenticatedUserId(req: Request): string {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  return req.auth.sub;
}

export async function checkout(req: Request, res: Response) {
  const result = await checkoutCoursePack(
    authenticatedUserId(req),
    checkoutSchema.parse(req.body),
  );
  res.status(201).json(result);
}

export async function list(req: Request, res: Response) {
  res.json({ packs: await listCoursePacks(authenticatedUserId(req)) });
}

export async function assign(req: Request, res: Response) {
  const { workerId } = assignmentSchema.parse(req.body);
  const result = await assignCoursePackSeat(
    authenticatedUserId(req),
    req.params.packId,
    workerId,
  );
  res.status(201).json(result);
}
