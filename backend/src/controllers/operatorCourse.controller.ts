import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  COURSE_PART_TYPES,
  COURSE_TIERS,
  COURSE_VISIBILITIES,
} from '../models/Course.js';
import { TAG_NAMES } from '../models/TechnologyTag.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  createOperatorCourse,
  listOperatorCourses,
  submitOperatorCourse,
  updateOperatorCourse,
} from '../services/operatorCourse.service.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');

const partSchema = z.object({
  partId: z.string().trim().min(1).max(100),
  type: z.enum(COURSE_PART_TYPES),
  title: z.string().trim().min(1).max(200),
  duration: z.string().trim().max(50).default(''),
  content: z.string().max(100_000).default(''),
  topics: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(2_000),
        options: z.array(z.string().trim().min(1).max(1_000)).min(2).max(20),
        correctIndex: z.number().int().min(0),
        explanation: z.string().max(5_000).default(''),
      }),
    )
    .max(100)
    .default([]),
  videoId: objectId.nullable().default(null),
});

const editableFields = {
  title: z.string().trim().min(1).max(200),
  techFocus: z.string().trim().min(1).max(200),
  tagName: z.enum(TAG_NAMES),
  tier: z.enum(COURSE_TIERS),
  duration: z.number().int().min(0).max(100_000).optional(),
  description: z.string().trim().max(20_000).optional(),
  provider: z.string().trim().min(1).max(200).optional(),
  isManufacturer: z.boolean().optional(),
  equipmentName: z.string().trim().max(200).nullable().optional(),
  passMark: z.number().int().min(0).max(100).optional(),
  retakeCooldownHours: z.number().int().min(0).max(8_760).optional(),
  techScoreContribution: z.number().int().min(0).max(10_000).optional(),
  priceCents: z.number().int().min(0).max(100_000_000).optional(),
  visibility: z.enum(COURSE_VISIBILITIES).optional(),
  technicalCompetencies: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
  parts: z.array(partSchema).max(500).optional(),
};

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case a-z0-9'),
  ...editableFields,
});

const updateSchema = z.object(editableFields).partial();

function authenticatedUserId(req: Request): string {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  return req.auth.sub;
}

export async function list(req: Request, res: Response) {
  res.json({ courses: await listOperatorCourses(authenticatedUserId(req)) });
}

export async function create(req: Request, res: Response) {
  const course = await createOperatorCourse(
    authenticatedUserId(req),
    createSchema.parse(req.body),
  );
  res.status(201).json({ course });
}

export async function update(req: Request, res: Response) {
  const course = await updateOperatorCourse(
    authenticatedUserId(req),
    req.params.id,
    updateSchema.parse(req.body),
  );
  res.json({ course });
}

export async function submit(req: Request, res: Response) {
  const course = await submitOperatorCourse(authenticatedUserId(req), req.params.id);
  res.json({ course });
}
