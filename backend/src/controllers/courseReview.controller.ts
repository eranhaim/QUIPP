import type { Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../middleware/errorHandler.js';
import {
  approveCourseReview,
  listCourseReviews,
  requestCourseReviewChanges,
} from '../services/courseReview.service.js';

const changeRequestSchema = z.object({
  notes: z.string().trim().min(1).max(10_000),
});

function authenticatedAdminId(req: Request): string {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  return req.auth.sub;
}

export async function list(_req: Request, res: Response) {
  res.json({ courses: await listCourseReviews() });
}

export async function approve(req: Request, res: Response) {
  const course = await approveCourseReview(authenticatedAdminId(req), req.params.id);
  res.json({ course });
}

export async function requestChanges(req: Request, res: Response) {
  const { notes } = changeRequestSchema.parse(req.body);
  const course = await requestCourseReviewChanges(
    authenticatedAdminId(req),
    req.params.id,
    notes,
  );
  res.json({ course });
}
