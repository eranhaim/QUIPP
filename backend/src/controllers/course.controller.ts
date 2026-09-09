import type { Request, Response } from 'express';
import { listCourses, getCourseBySlug } from '../services/course.service.js';

export async function list(req: Request, res: Response) {
  const courses = await listCourses(req.auth!.sub);
  res.json({ courses });
}

export async function bySlug(req: Request, res: Response) {
  const course = await getCourseBySlug(req.params.slug, req.auth!.sub);
  res.json({ course });
}
