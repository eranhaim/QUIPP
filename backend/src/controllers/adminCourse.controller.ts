import type { Request, Response } from 'express';
import { z } from 'zod';
import { TAG_NAMES } from '../models/TechnologyTag.js';
import { COURSE_TIERS, COURSE_STATUSES, COURSE_PART_TYPES } from '../models/Course.js';
import {
  adminCreateCourse,
  adminGetCourse,
  adminListCourses,
  adminSetStatus,
  adminUpdateCourse,
} from '../services/course.service.js';

const partSchema = z.object({
  partId: z.string().min(1),
  type: z.enum(COURSE_PART_TYPES),
  title: z.string().min(1),
  duration: z.string().default(''),
  content: z.string().default(''),
  topics: z.array(z.string()).default([]),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
        explanation: z.string().default(''),
      }),
    )
    .default([]),
  videoId: z.string().nullable().default(null),
});

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case a-z0-9'),
  title: z.string().min(1).max(200),
  techFocus: z.string().min(1).max(200),
  tagName: z.enum(TAG_NAMES),
  tier: z.enum(COURSE_TIERS),
  duration: z.number().int().min(0).optional(),
  description: z.string().optional(),
  provider: z.string().optional(),
  isManufacturer: z.boolean().optional(),
  equipmentName: z.string().nullable().optional(),
  passMark: z.number().int().min(0).max(100).optional(),
  retakeCooldownHours: z.number().int().min(0).optional(),
  techScoreContribution: z.number().int().min(0).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  technicalCompetencies: z.array(z.string()).optional(),
  parts: z.array(partSchema).optional(),
});

const updateSchema = createSchema.partial().extend({
  parts: z.array(partSchema).optional(),
});

export async function list(_req: Request, res: Response) {
  const courses = await adminListCourses();
  res.json({ courses });
}

export async function detail(req: Request, res: Response) {
  const course = await adminGetCourse(req.params.slug);
  res.json({ course });
}

export async function create(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const course = await adminCreateCourse(input);
  res.status(201).json({ course });
}

export async function update(req: Request, res: Response) {
  const patch = updateSchema.parse(req.body);
  const course = await adminUpdateCourse(req.params.slug, patch);
  res.json({ course });
}

const statusSchema = z.object({ status: z.enum(COURSE_STATUSES) });

export async function setStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  const course = await adminSetStatus(req.params.slug, status);
  res.json({ course });
}
