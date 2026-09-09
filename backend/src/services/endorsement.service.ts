import { isValidObjectId } from 'mongoose';
import { Course } from '../models/Course.js';
import { CourseEnrollment } from '../models/CourseEnrollment.js';
import { Credential } from '../models/Credential.js';
import { Endorsement, type EndorsementDoc } from '../models/Endorsement.js';
import { Operator } from '../models/Operator.js';
import { User } from '../models/User.js';
import { WorkplaceLink } from '../models/WorkplaceLink.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getOperatorAccess } from './operator.service.js';
import { issueCourseCredential } from './credential.service.js';

export interface PublicEndorsement {
  id: string;
  workerId: string;
  operatorId: string;
  thereCourseId: string;
  deepCredentialId: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  worker: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  operator: { companyName: string } | null;
  thereCourse: {
    slug: string;
    title: string;
    tagName: string;
    techFocus: string;
    equipmentName: string | null;
  } | null;
  deepCredential: {
    courseName: string;
    tagName: string;
    techFocus: string;
  } | null;
}

export interface RequestEndorsementInput {
  operatorId: string;
  thereCourseId: string;
  deepCredentialId: string;
  statement: string;
}

function requireObjectId(value: string, field: string): void {
  if (!isValidObjectId(value)) throw new HttpError(400, `Invalid ${field}`);
}

function comparable(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

async function toPublic(docs: EndorsementDoc[]): Promise<PublicEndorsement[]> {
  if (docs.length === 0) return [];

  const [workers, operators, courses, credentials] = await Promise.all([
    User.find({ _id: { $in: docs.map((doc) => doc.workerId) } })
      .select('firstName lastName email')
      .lean(),
    Operator.find({ _id: { $in: docs.map((doc) => doc.operatorId) } })
      .select('companyName')
      .lean(),
    Course.find({ _id: { $in: docs.map((doc) => doc.thereCourseId) } })
      .select('slug title tagName techFocus equipmentName')
      .lean(),
    Credential.find({ _id: { $in: docs.map((doc) => doc.deepCredentialId) } })
      .select('courseName tagName techFocus')
      .lean(),
  ]);

  const workerMap = new Map(workers.map((worker) => [String(worker._id), worker]));
  const operatorMap = new Map(operators.map((operator) => [String(operator._id), operator]));
  const courseMap = new Map(courses.map((course) => [String(course._id), course]));
  const credentialMap = new Map(
    credentials.map((credential) => [String(credential._id), credential]),
  );

  return docs.map((doc) => {
    const worker = workerMap.get(String(doc.workerId));
    const operator = operatorMap.get(String(doc.operatorId));
    const course = courseMap.get(String(doc.thereCourseId));
    const credential = credentialMap.get(String(doc.deepCredentialId));
    return {
      id: String(doc._id),
      workerId: String(doc.workerId),
      operatorId: String(doc.operatorId),
      thereCourseId: String(doc.thereCourseId),
      deepCredentialId: String(doc.deepCredentialId),
      statement: doc.statement,
      status: doc.status,
      requestedAt: doc.requestedAt.toISOString(),
      reviewedBy: doc.reviewedBy ? String(doc.reviewedBy) : null,
      reviewedAt: doc.reviewedAt?.toISOString() ?? null,
      reviewNotes: doc.reviewNotes ?? null,
      worker: worker
        ? {
            firstName: worker.firstName ?? null,
            lastName: worker.lastName ?? null,
            email: worker.email,
          }
        : null,
      operator: operator ? { companyName: operator.companyName } : null,
      thereCourse: course
        ? {
            slug: course.slug,
            title: course.title,
            tagName: course.tagName,
            techFocus: course.techFocus,
            equipmentName: course.equipmentName ?? null,
          }
        : null,
      deepCredential: credential
        ? {
            courseName: credential.courseName,
            tagName: credential.tagName,
            techFocus: credential.techFocus,
          }
        : null,
    };
  });
}

export async function requestEndorsement(
  workerId: string,
  input: RequestEndorsementInput,
): Promise<PublicEndorsement> {
  requireObjectId(input.operatorId, 'operatorId');
  requireObjectId(input.thereCourseId, 'thereCourseId');
  requireObjectId(input.deepCredentialId, 'deepCredentialId');

  const [deepCredential, thereCourse, workplace] = await Promise.all([
    Credential.findOne({
      _id: input.deepCredentialId,
      userId: workerId,
      tier: 'DEEP',
      status: 'active',
    }),
    Course.findOne({
      _id: input.thereCourseId,
      tier: 'THERE',
      status: 'published',
    }),
    WorkplaceLink.findOne({
      workerId,
      operatorId: input.operatorId,
      status: 'active',
    }),
  ]);

  if (!deepCredential) {
    throw new HttpError(400, 'An active DEEP credential owned by the worker is required');
  }
  if (!thereCourse) throw new HttpError(400, 'A published THERE course is required');
  if (!workplace) {
    throw new HttpError(403, 'An active workplace link to this operator is required');
  }

  const deepCourse = await Course.findById(deepCredential.courseId).select(
    'tagName techFocus equipmentName',
  );
  if (!deepCourse) throw new HttpError(400, 'The DEEP credential course no longer exists');

  const relevant =
    deepCourse.tagName === thereCourse.tagName ||
    (comparable(deepCourse.techFocus) !== '' &&
      comparable(deepCourse.techFocus) === comparable(thereCourse.techFocus)) ||
    (comparable(deepCourse.equipmentName) !== '' &&
      comparable(deepCourse.equipmentName) === comparable(thereCourse.equipmentName));
  if (!relevant) {
    throw new HttpError(
      400,
      'The THERE course must match the DEEP credential technology, equipment, or category',
    );
  }

  const alreadyApproved = await Endorsement.exists({
    workerId,
    thereCourseId: thereCourse._id,
    status: 'approved',
  });
  if (alreadyApproved) {
    throw new HttpError(409, 'This THERE course already has an approved endorsement');
  }

  try {
    const endorsement = await Endorsement.create({
      workerId,
      operatorId: input.operatorId,
      thereCourseId: thereCourse._id,
      deepCredentialId: deepCredential._id,
      statement: input.statement.trim(),
      status: 'pending',
      requestedAt: new Date(),
    });
    return (await toPublic([endorsement as EndorsementDoc]))[0];
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new HttpError(409, 'A pending endorsement request already exists');
    }
    throw error;
  }
}

export async function listWorkerEndorsements(workerId: string): Promise<PublicEndorsement[]> {
  const docs = await Endorsement.find({ workerId }).sort({ requestedAt: -1 });
  return toPublic(docs as EndorsementDoc[]);
}

export async function listOperatorEndorsements(reviewerId: string): Promise<PublicEndorsement[]> {
  const { operator } = await getOperatorAccess(reviewerId);
  const docs = await Endorsement.find({ operatorId: operator._id }).sort({
    status: -1,
    requestedAt: -1,
  });
  return toPublic(docs as EndorsementDoc[]);
}

async function requirePendingOperatorEndorsement(reviewerId: string, id: string) {
  requireObjectId(id, 'endorsement id');
  const { operator } = await getOperatorAccess(reviewerId);
  const endorsement = await Endorsement.findOne({ _id: id, operatorId: operator._id });
  if (!endorsement) throw new HttpError(404, 'Endorsement not found');
  if (endorsement.status !== 'pending') {
    throw new HttpError(409, `Endorsement is already ${endorsement.status}`);
  }
  const workplace = await WorkplaceLink.exists({
    workerId: endorsement.workerId,
    operatorId: operator._id,
    status: 'active',
  });
  if (!workplace) {
    throw new HttpError(409, 'The worker no longer has an active workplace link');
  }
  return { endorsement, operator };
}

export async function approveEndorsement(
  reviewerId: string,
  id: string,
  reviewNotes?: string,
): Promise<PublicEndorsement> {
  const { endorsement, operator } = await requirePendingOperatorEndorsement(reviewerId, id);
  const course = await Course.findOne({ _id: endorsement.thereCourseId, tier: 'THERE' });
  if (!course) throw new HttpError(404, 'THERE course no longer exists');

  const reviewedAt = new Date();
  const approved = await Endorsement.findOneAndUpdate(
    { _id: endorsement._id, operatorId: operator._id, status: 'pending' },
    {
      $set: {
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt,
        reviewNotes: reviewNotes?.trim() || null,
      },
    },
    { new: true, runValidators: true },
  );
  if (!approved) throw new HttpError(409, 'Endorsement is no longer pending');

  const enrollment = await CourseEnrollment.findOne({
    userId: approved.workerId,
    courseId: course._id,
    status: 'completed',
  });
  if (enrollment) {
    await issueCourseCredential(String(approved.workerId), course, enrollment.lastScore ?? null);
  }

  return (await toPublic([approved as EndorsementDoc]))[0];
}

export async function rejectEndorsement(
  reviewerId: string,
  id: string,
  reviewNotes: string,
): Promise<PublicEndorsement> {
  const notes = reviewNotes.trim();
  if (!notes) throw new HttpError(400, 'Review notes are required when rejecting');
  const { endorsement, operator } = await requirePendingOperatorEndorsement(reviewerId, id);

  const rejected = await Endorsement.findOneAndUpdate(
    { _id: endorsement._id, operatorId: operator._id, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    },
    { new: true, runValidators: true },
  );
  if (!rejected) throw new HttpError(409, 'Endorsement is no longer pending');
  return (await toPublic([rejected as EndorsementDoc]))[0];
}
