import type { Request, Response } from 'express';
import { z } from 'zod';
import { BASE_ROLES } from '../models/Profile.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  acceptWorkplaceLink,
  createCourseAssignment,
  createOperatorLocation,
  createTrainingRequirement,
  declineWorkplaceLink,
  getMyOperator,
  getOperatorOverview,
  inviteWorker,
  listCourseAssignments,
  listMyWorkplaceLinks,
  listOperatorLocations,
  listOperatorRoster,
  listTrainingRequirements,
  setupOperator,
  unlinkWorkplace,
} from '../services/operator.service.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');

const setupSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  businessType: z.string().trim().min(1).max(100),
  staffSize: z.number().int().min(0).max(1_000_000),
  hqLocation: z.string().trim().min(1).max(200),
  locationName: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  timezone: z.string().trim().min(1).max(100),
});

const locationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9_-]+$/i, 'Code may contain letters, numbers, underscores and hyphens'),
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  timezone: z.string().trim().min(1).max(100),
});

const inviteSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  locationId: objectId.nullable().optional(),
});

const courseReferenceSchema = z
  .object({
    courseId: objectId.optional(),
    courseSlug: z.string().trim().min(1).max(100).toLowerCase().optional(),
  })
  .refine((value) => Boolean(value.courseId || value.courseSlug), {
    message: 'courseId or courseSlug is required',
  });

const requirementSchema = z
  .object({
    locationId: objectId.nullable().optional(),
    baseRole: z.enum(BASE_ROLES).nullable().optional(),
    required: z.boolean().optional(),
  })
  .and(courseReferenceSchema);

const assignmentSchema = z
  .object({
    locationId: objectId.nullable().optional(),
    workerId: objectId,
  })
  .and(courseReferenceSchema);

function authenticatedUserId(req: Request): string {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  return req.auth.sub;
}

export async function setup(req: Request, res: Response) {
  const result = await setupOperator(authenticatedUserId(req), setupSchema.parse(req.body));
  res.status(201).json(result);
}

export async function me(req: Request, res: Response) {
  res.json(await getMyOperator(authenticatedUserId(req)));
}

export async function overview(req: Request, res: Response) {
  res.json({ overview: await getOperatorOverview(authenticatedUserId(req)) });
}

export async function locations(req: Request, res: Response) {
  res.json({ locations: await listOperatorLocations(authenticatedUserId(req)) });
}

export async function addLocation(req: Request, res: Response) {
  const location = await createOperatorLocation(
    authenticatedUserId(req),
    locationSchema.parse(req.body),
  );
  res.status(201).json({ location });
}

export async function roster(req: Request, res: Response) {
  res.json({ roster: await listOperatorRoster(authenticatedUserId(req)) });
}

export async function invite(req: Request, res: Response) {
  const link = await inviteWorker(authenticatedUserId(req), inviteSchema.parse(req.body));
  res.status(201).json({ link });
}

export async function myWorkplaces(req: Request, res: Response) {
  const links = await listMyWorkplaceLinks(authenticatedUserId(req));
  res.json({ links });
}

export async function acceptLink(req: Request, res: Response) {
  const link = await acceptWorkplaceLink(authenticatedUserId(req), req.params.id);
  res.json({ link });
}

export async function declineLink(req: Request, res: Response) {
  const link = await declineWorkplaceLink(authenticatedUserId(req), req.params.id);
  res.json({ link });
}

export async function unlink(req: Request, res: Response) {
  const link = await unlinkWorkplace(authenticatedUserId(req), req.params.id);
  res.json({ link });
}

export async function requirements(req: Request, res: Response) {
  res.json({
    requirements: await listTrainingRequirements(authenticatedUserId(req)),
  });
}

export async function addRequirement(req: Request, res: Response) {
  const requirement = await createTrainingRequirement(
    authenticatedUserId(req),
    requirementSchema.parse(req.body),
  );
  res.status(201).json({ requirement });
}

export async function assignments(req: Request, res: Response) {
  res.json({
    assignments: await listCourseAssignments(authenticatedUserId(req)),
  });
}

export async function addAssignment(req: Request, res: Response) {
  const assignment = await createCourseAssignment(
    authenticatedUserId(req),
    assignmentSchema.parse(req.body),
  );
  res.status(201).json({ assignment });
}
