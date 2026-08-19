import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  enrollInCourse,
  listMyEnrollments,
  completeQuiz,
} from '../services/enrollment.service.js';
import { HttpError } from '../middleware/errorHandler.js';

const enrollSchema = z.object({
  courseSlug: z.string().min(1).trim().toLowerCase(),
});

const completeSchema = z.object({
  answers: z.array(z.number().int().min(0)).min(1).max(100),
});

export async function enroll(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const { courseSlug } = enrollSchema.parse(req.body);
  const enrollment = await enrollInCourse(req.auth.sub, courseSlug);
  res.status(201).json({ enrollment });
}

export async function myEnrollments(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const enrollments = await listMyEnrollments(req.auth.sub);
  res.json({ enrollments });
}

export async function submitQuiz(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const body = completeSchema.parse(req.body);
  const result = await completeQuiz(req.auth.sub, req.params.slug, { answers: body.answers });
  res.json({ result });
}
