import mongoose from 'mongoose';
import { CourseEnrollment } from '../models/CourseEnrollment.js';
import { Course } from '../models/Course.js';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { CourseAccessPack } from '../models/CourseAccessPack.js';
import { Endorsement } from '../models/Endorsement.js';
import { SeatAssignment } from '../models/SeatAssignment.js';
import { WorkplaceLink } from '../models/WorkplaceLink.js';
import { HttpError } from '../middleware/errorHandler.js';
import { gradeQuiz } from './course.service.js';
import { issueCourseCredential } from './credential.service.js';

export interface PublicEnrollment {
  id: string;
  courseSlug: string;
  courseTitle: string;
  tagName: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  status: 'in_progress' | 'completed' | 'failed';
  progressPct: number;
  startedAt: string;
  completedAt: string | null;
  lastScore: number | null;
  lastAttemptAt: string | null;
  cooldownEndsAt: string | null;
}

export async function enrollInCourse(userId: string, slug: string): Promise<PublicEnrollment> {
  const course = await Course.findOne({ slug: slug.toLowerCase() });
  if (!course) throw new HttpError(404, 'Course not found');
  if (course.status !== 'published') throw new HttpError(400, 'Course is not open for enrollment');
  if (course.visibility === 'organization') {
    const linked = await WorkplaceLink.exists({
      workerId: userId,
      operatorId: course.ownerOperatorId,
      status: 'active',
    });
    if (!linked) throw new HttpError(403, 'This course is private to its organization');
  }

  const existing = await CourseEnrollment.findOne({ userId, courseSlug: course.slug });
  if (existing) return toPublicEnrollment(existing, course);

  if (course.priceCents === 0) {
    const enrollment = await CourseEnrollment.create({
      userId,
      courseId: course._id,
      courseSlug: course.slug,
      sourceType: 'free',
    });
    return toPublicEnrollment(enrollment, course);
  }

  const dbSession = await mongoose.startSession();
  let enrollment: InstanceType<typeof CourseEnrollment> | undefined;
  try {
    await dbSession.withTransaction(async () => {
      const now = new Date();
      const candidateSeats = await SeatAssignment.find({
        workerId: userId,
        courseId: course._id,
        status: 'assigned',
      })
        .sort({ assignedAt: 1 })
        .session(dbSession);
      const packIds = candidateSeats.map((seat) => seat.packId);
      const packs = await CourseAccessPack.find({
        _id: { $in: packIds },
        status: { $in: ['active', 'exhausted'] },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      })
        .select('_id')
        .session(dbSession);
      const validPackIds = new Set(packs.map((pack) => String(pack._id)));
      const candidate = candidateSeats.find((seat) => validPackIds.has(String(seat.packId)));
      if (!candidate) {
        throw new HttpError(403, 'A valid assigned course seat is required');
      }

      const consumedSeat = await SeatAssignment.findOneAndUpdate(
        { _id: candidate._id, status: 'assigned' },
        { $set: { status: 'consumed', consumedAt: now } },
        { new: true, session: dbSession },
      );
      if (!consumedSeat) throw new HttpError(409, 'Course seat was already consumed');

      [enrollment] = await CourseEnrollment.create(
        [
          {
            userId,
            courseId: course._id,
            courseSlug: course.slug,
            sourceType: 'library',
            sourceId: consumedSeat._id,
            sourceOperatorId: consumedSeat.operatorId,
          },
        ],
        { session: dbSession },
      );
      await CourseAssignment.updateOne(
        {
          operatorId: consumedSeat.operatorId,
          workerId: userId,
          courseId: course._id,
        },
        { $set: { status: 'in_progress', startedAt: enrollment.startedAt } },
        { session: dbSession },
      );
    });
  } finally {
    await dbSession.endSession();
  }
  if (!enrollment) throw new HttpError(500, 'Could not create enrollment');
  return toPublicEnrollment(enrollment, course);
}

export async function listMyEnrollments(userId: string): Promise<PublicEnrollment[]> {
  const enrollments = await CourseEnrollment.find({ userId }).sort({ updatedAt: -1 });
  if (enrollments.length === 0) return [];
  const courseIds = enrollments.map((e) => e.courseId);
  const courses = await Course.find({ _id: { $in: courseIds } });
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));
  return enrollments
    .map((e) => {
      const c = courseMap.get(String(e.courseId));
      if (!c) return null;
      return toPublicEnrollment(e, c);
    })
    .filter((x): x is PublicEnrollment => x !== null);
}

export interface CompleteQuizInput {
  answers: number[];
}

export interface CompleteQuizResult {
  passed: boolean;
  scorePct: number;
  correctCount: number;
  totalQuestions: number;
  passMark: number;
  cooldownEndsAt: string | null;
  credentialId: string | null;
  verificationId: string | null;
  credentialPendingReason: string | null;
  review: Array<{
    question: string;
    correctIndex: number;
    yourIndex: number;
    correct: boolean;
    explanation: string;
  }>;
}

export async function completeQuiz(
  userId: string,
  slug: string,
  input: CompleteQuizInput,
): Promise<CompleteQuizResult> {
  const course = await Course.findOne({ slug: slug.toLowerCase() });
  if (!course) throw new HttpError(404, 'Course not found');

  const enrollment = await CourseEnrollment.findOne({ userId, courseSlug: course.slug });
  if (!enrollment) throw new HttpError(400, 'Enroll before submitting a quiz');

  if (enrollment.status === 'completed') {
    throw new HttpError(400, 'Course already completed');
  }

  const cooldownMs = course.retakeCooldownHours * 60 * 60 * 1000;
  if (enrollment.lastAttemptAt) {
    const nextAllowed = enrollment.lastAttemptAt.getTime() + cooldownMs;
    if (nextAllowed > Date.now()) {
      throw new HttpError(429, 'Retake cooldown in effect', {
        cooldownEndsAt: new Date(nextAllowed).toISOString(),
      });
    }
  }

  const grade = await gradeQuiz(course.slug, input.answers);

  enrollment.lastAttemptAt = new Date();
  enrollment.lastScore = grade.scorePct;

  let credentialId: string | null = null;
  let verificationId: string | null = null;
  let credentialPendingReason: string | null = null;

  if (grade.passed) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    enrollment.progressPct = 100;

    const hasApprovedEndorsement =
      course.tier !== 'THERE' ||
      Boolean(
        await Endorsement.exists({
          workerId: userId,
          thereCourseId: course._id,
          status: 'approved',
        }),
      );
    if (hasApprovedEndorsement) {
      const credential = await issueCourseCredential(userId, course, grade.scorePct);
      credentialId = String(credential._id);
      verificationId = credential.verificationId;
    } else {
      credentialPendingReason =
        'Verified employer endorsement is required before a THERE credential can be issued.';
    }
  } else {
    enrollment.status = 'failed';
    enrollment.progressPct = Math.max(enrollment.progressPct, 50);
  }

  await enrollment.save();

  // Close the approval/quiz race: approval records its decision before checking
  // completion, and a completing quiz rechecks after persisting the enrollment.
  if (grade.passed && course.tier === 'THERE' && credentialPendingReason) {
    const endorsement = await Endorsement.exists({
      workerId: userId,
      thereCourseId: course._id,
      status: 'approved',
    });
    if (endorsement) {
      const credential = await issueCourseCredential(userId, course, grade.scorePct);
      credentialId = String(credential._id);
      verificationId = credential.verificationId;
      credentialPendingReason = null;
    }
  }

  if (grade.passed && enrollment.completedAt) {
    await CourseAssignment.updateMany(
      {
        workerId: userId,
        courseId: course._id,
        status: { $ne: 'completed' },
      },
      {
        $set: {
          status: 'completed',
          startedAt: enrollment.startedAt,
          completedAt: enrollment.completedAt,
        },
      },
    );
  }

  const cooldownEndsAt = enrollment.lastAttemptAt
    ? new Date(enrollment.lastAttemptAt.getTime() + cooldownMs).toISOString()
    : null;

  return {
    passed: grade.passed,
    scorePct: grade.scorePct,
    correctCount: grade.correctCount,
    totalQuestions: grade.totalQuestions,
    passMark: grade.passMark,
    cooldownEndsAt: grade.passed ? null : cooldownEndsAt,
    credentialId,
    verificationId,
    credentialPendingReason,
    review: grade.review,
  };
}

interface EnrollmentDocLike {
  _id: unknown;
  courseSlug: string;
  status: 'in_progress' | 'completed' | 'failed';
  progressPct: number;
  startedAt: Date;
  completedAt?: Date | null;
  lastAttemptAt?: Date | null;
  lastScore?: number | null;
}

function toPublicEnrollment(
  e: EnrollmentDocLike,
  c: { title: string; tagName: string; tier: 'IN' | 'DEEP' | 'THERE'; retakeCooldownHours: number },
): PublicEnrollment {
  const cooldownEndsAt = e.lastAttemptAt
    ? new Date(e.lastAttemptAt.getTime() + c.retakeCooldownHours * 60 * 60 * 1000).toISOString()
    : null;
  return {
    id: String(e._id),
    courseSlug: e.courseSlug,
    courseTitle: c.title,
    tagName: c.tagName,
    tier: c.tier,
    status: e.status,
    progressPct: e.progressPct,
    startedAt: e.startedAt.toISOString(),
    completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    lastScore: e.lastScore ?? null,
    lastAttemptAt: e.lastAttemptAt ? e.lastAttemptAt.toISOString() : null,
    cooldownEndsAt,
  };
}
