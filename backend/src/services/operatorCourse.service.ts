import { isValidObjectId } from 'mongoose';
import { Course } from '../models/Course.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  type AdminCourse,
  type AdminCourseInput,
  toAdminCourse,
  type RawCourse,
} from './course.service.js';
import { getOperatorAccess } from './operator.service.js';

export type OperatorCourseInput = Omit<AdminCourseInput, 'status' | 'stripePriceId'>;

function assertCourseId(id: string): void {
  if (!isValidObjectId(id)) throw new HttpError(400, 'Invalid course id');
}

function validateSubmission(course: InstanceType<typeof Course>): void {
  if (!course.title.trim()) throw new HttpError(400, 'Course title is required');
  if (!course.description.trim()) throw new HttpError(400, 'Course description is required');
  if (course.parts.length < 1) throw new HttpError(400, 'Course must contain at least one part');

  for (const part of course.parts) {
    if (!part.title.trim()) throw new HttpError(400, 'Every course part requires a title');
    if (part.type === 'video' && !part.videoId && !part.directVideoUrl) {
      throw new HttpError(400, `Video part "${part.title}" requires a video`);
    }
    if (part.type === 'mastery_check') {
      if (part.questions.length < 1) {
        throw new HttpError(400, `Mastery check "${part.title}" requires a question`);
      }
      for (const question of part.questions) {
        if (
          question.options.length < 2 ||
          question.correctIndex < 0 ||
          question.correctIndex >= question.options.length
        ) {
          throw new HttpError(400, `Invalid quiz question in "${part.title}"`);
        }
      }
    }
  }
}

export async function listOperatorCourses(userId: string): Promise<AdminCourse[]> {
  const { operator } = await getOperatorAccess(userId);
  const courses = await Course.find({
    ownerType: 'operator',
    ownerOperatorId: operator._id,
  })
    .sort({ updatedAt: -1 })
    .lean();
  return courses.map((course) => toAdminCourse(course as unknown as RawCourse));
}

export async function createOperatorCourse(
  userId: string,
  input: OperatorCourseInput,
): Promise<AdminCourse> {
  const { operator } = await getOperatorAccess(userId);
  const slug = input.slug.toLowerCase().trim();
  if (await Course.exists({ slug })) {
    throw new HttpError(409, `Course with slug "${slug}" already exists`);
  }
  const course = await Course.create({
    ...input,
    slug,
    duration: input.duration ?? 30,
    description: input.description ?? '',
    provider: input.provider ?? operator.companyName,
    isManufacturer: input.isManufacturer ?? false,
    equipmentName: input.equipmentName ?? null,
    passMark: input.passMark ?? 80,
    retakeCooldownHours: input.retakeCooldownHours ?? 24,
    techScoreContribution: input.techScoreContribution ?? 5,
    priceCents: input.priceCents ?? 0,
    visibility: input.visibility ?? 'public',
    technicalCompetencies: input.technicalCompetencies ?? [],
    parts: input.parts ?? [],
    ownerType: 'operator',
    ownerOperatorId: operator._id,
    createdByUserId: userId,
    status: 'draft',
    reviewStatus: 'draft',
  });
  return toAdminCourse(course.toObject() as unknown as RawCourse);
}

export async function updateOperatorCourse(
  userId: string,
  id: string,
  patch: Partial<OperatorCourseInput>,
): Promise<AdminCourse> {
  assertCourseId(id);
  const { operator } = await getOperatorAccess(userId);
  const course = await Course.findOne({
    _id: id,
    ownerType: 'operator',
    ownerOperatorId: operator._id,
  });
  if (!course) throw new HttpError(404, 'Operator course not found');
  if (!['draft', 'changes_requested'].includes(course.status)) {
    throw new HttpError(409, 'Course is not editable while under review or published');
  }

  const allowed: Array<keyof OperatorCourseInput> = [
    'title',
    'techFocus',
    'tagName',
    'tier',
    'duration',
    'description',
    'provider',
    'isManufacturer',
    'equipmentName',
    'passMark',
    'retakeCooldownHours',
    'techScoreContribution',
    'priceCents',
    'visibility',
    'technicalCompetencies',
    'parts',
  ];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      // The controller strips unknown fields and this list is the final write allowlist.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (course as any)[key] = patch[key];
    }
  }
  await course.save();
  return toAdminCourse(course.toObject() as unknown as RawCourse);
}

export async function submitOperatorCourse(userId: string, id: string): Promise<AdminCourse> {
  assertCourseId(id);
  const { operator } = await getOperatorAccess(userId);
  const course = await Course.findOne({
    _id: id,
    ownerType: 'operator',
    ownerOperatorId: operator._id,
    status: { $in: ['draft', 'changes_requested'] },
  });
  if (!course) throw new HttpError(404, 'Editable operator course not found');
  validateSubmission(course);
  course.status = 'submitted';
  course.reviewStatus = 'submitted';
  course.reviewNotes = '';
  course.reviewedBy = null;
  course.reviewedAt = null;
  await course.save();
  return toAdminCourse(course.toObject() as unknown as RawCourse);
}
