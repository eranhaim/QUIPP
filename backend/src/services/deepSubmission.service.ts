import { DeepSubmission, type DeepSubmissionDoc } from '../models/DeepSubmission.js';
import { Credential } from '../models/Credential.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { HttpError } from '../middleware/errorHandler.js';
import { randomToken } from '../lib/crypto.js';
import { refreshTechScore } from './profile.service.js';

export interface PublicDeepSubmission {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  inCredentialId: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorText: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  worker?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface HydratedSub extends DeepSubmissionDoc {
  __courseTitle?: string;
  __worker?: PublicDeepSubmission['worker'];
}

function toPublic(s: HydratedSub): PublicDeepSubmission {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createdAt = (s as any).createdAt as Date;
  return {
    id: String(s._id),
    userId: String(s.userId),
    courseId: String(s.deepCourseId),
    courseSlug: s.deepCourseSlug,
    courseTitle: s.__courseTitle ?? '',
    inCredentialId: String(s.inCredentialId),
    supervisorName: s.supervisorName,
    supervisorEmail: s.supervisorEmail,
    supervisorText: s.supervisorText,
    status: s.status as PublicDeepSubmission['status'],
    reviewNotes: s.reviewNotes ?? null,
    reviewedBy: s.reviewedBy ? String(s.reviewedBy) : null,
    reviewedAt: s.reviewedAt ? new Date(s.reviewedAt).toISOString() : null,
    submittedAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
    worker: s.__worker,
  };
}

/**
 * Find the DEEP-tier course that matches an IN credential. Convention: same
 * equipmentName, tier=DEEP, and published. Falls back to same tagName if no
 * equipment match. Returns null if no viable DEEP course exists.
 */
async function findDeepCourseFor(inCredential: {
  courseSlug: string;
  tagName: string;
}): Promise<{ _id: unknown; slug: string; title: string } | null> {
  const inCourse = await Course.findOne({ slug: inCredential.courseSlug }).lean();
  if (!inCourse) return null;

  // Preferred: same equipmentName, tier DEEP.
  if (inCourse.equipmentName) {
    const exact = await Course.findOne({
      equipmentName: inCourse.equipmentName,
      tier: 'DEEP',
      status: 'published',
    })
      .select({ slug: 1, title: 1 })
      .lean();
    if (exact) return exact as unknown as { _id: unknown; slug: string; title: string };
  }

  // Fallback: convention-based slug `${inSlug}-deep`.
  const byConvention = await Course.findOne({
    slug: `${inCourse.slug}-deep`,
    tier: 'DEEP',
    status: 'published',
  })
    .select({ slug: 1, title: 1 })
    .lean();
  if (byConvention) return byConvention as unknown as { _id: unknown; slug: string; title: string };

  // Last resort: same tagName, tier DEEP.
  const byTag = await Course.findOne({
    tagName: inCredential.tagName,
    tier: 'DEEP',
    status: 'published',
  })
    .select({ slug: 1, title: 1 })
    .lean();
  return (byTag as unknown as { _id: unknown; slug: string; title: string } | null) ?? null;
}

export interface SubmitInput {
  userId: string;
  inCredentialId: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorText: string;
}

export async function submit(input: SubmitInput): Promise<PublicDeepSubmission> {
  const cred = await Credential.findOne({ _id: input.inCredentialId, userId: input.userId });
  if (!cred) throw new HttpError(404, 'IN credential not found');
  if (cred.tier !== 'IN') {
    throw new HttpError(400, 'DEEP submissions must reference an IN credential');
  }

  const deepCourse = await findDeepCourseFor({
    courseSlug: cred.courseSlug,
    tagName: cred.tagName,
  });
  if (!deepCourse) {
    throw new HttpError(404, 'No DEEP course available yet for this equipment');
  }

  // Prevent double-issuance.
  const alreadyDeep = await Credential.findOne({
    userId: input.userId,
    courseSlug: deepCourse.slug,
  });
  if (alreadyDeep) {
    throw new HttpError(409, 'You already hold a DEEP credential for this equipment');
  }

  // Prevent duplicate pending submissions (also enforced by index).
  const openPending = await DeepSubmission.findOne({
    userId: input.userId,
    deepCourseSlug: deepCourse.slug,
    status: 'pending',
  });
  if (openPending) {
    throw new HttpError(409, 'You already have a pending DEEP submission for this equipment');
  }

  const doc = await DeepSubmission.create({
    userId: input.userId,
    inCredentialId: cred._id,
    deepCourseId: deepCourse._id,
    deepCourseSlug: deepCourse.slug,
    supervisorName: input.supervisorName.trim(),
    supervisorEmail: input.supervisorEmail.trim(),
    supervisorText: input.supervisorText.trim(),
    status: 'pending',
  });
  const hydrated: HydratedSub = doc as unknown as HydratedSub;
  hydrated.__courseTitle = deepCourse.title;
  return toPublic(hydrated);
}

export async function listMine(userId: string): Promise<PublicDeepSubmission[]> {
  const docs = await DeepSubmission.find({ userId }).sort({ createdAt: -1 });
  if (docs.length === 0) return [];
  const courseIds = docs.map((d) => d.deepCourseId);
  const titles = await Course.find({ _id: { $in: courseIds } })
    .select({ _id: 1, title: 1 })
    .lean();
  const map = new Map(titles.map((c) => [String(c._id), c.title]));
  return docs.map((d) => {
    const h = d as unknown as HydratedSub;
    h.__courseTitle = map.get(String(d.deepCourseId)) ?? '';
    return toPublic(h);
  });
}

export async function listPending(): Promise<PublicDeepSubmission[]> {
  const docs = await DeepSubmission.find({ status: 'pending' }).sort({ createdAt: -1 });
  if (docs.length === 0) return [];
  const courseIds = docs.map((d) => d.deepCourseId);
  const userIds = docs.map((d) => d.userId);
  const [titles, users, profiles] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }).select({ _id: 1, title: 1 }).lean(),
    User.find({ _id: { $in: userIds } }).select({ _id: 1, firstName: 1, lastName: 1 }).lean(),
    Profile.find({ userId: { $in: userIds } }).select({ userId: 1, username: 1 }).lean(),
  ]);
  const titleMap = new Map(titles.map((c) => [String(c._id), c.title]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));
  return docs.map((d) => {
    const h = d as unknown as HydratedSub;
    h.__courseTitle = titleMap.get(String(d.deepCourseId)) ?? '';
    const u = userMap.get(String(d.userId));
    const p = profileMap.get(String(d.userId));
    h.__worker = {
      id: String(d.userId),
      username: p?.username ?? '',
      firstName: u?.firstName ?? null,
      lastName: u?.lastName ?? null,
    };
    return toPublic(h);
  });
}

async function findSubmission(id: string) {
  const doc = await DeepSubmission.findById(id);
  if (!doc) throw new HttpError(404, 'Submission not found');
  return doc;
}

export async function approve(
  id: string,
  reviewerId: string,
  reviewNotes?: string,
): Promise<PublicDeepSubmission> {
  const doc = await findSubmission(id);
  if (doc.status !== 'pending') {
    throw new HttpError(409, `Submission is already ${doc.status}`);
  }

  const course = await Course.findById(doc.deepCourseId);
  if (!course) throw new HttpError(404, 'DEEP course no longer exists');

  const existingCred = await Credential.findOne({
    userId: doc.userId,
    courseSlug: course.slug,
  });

  let credentialId: string;
  if (existingCred) {
    credentialId = String(existingCred._id);
  } else {
    const cred = await Credential.create({
      userId: doc.userId,
      courseId: course._id,
      courseSlug: course.slug,
      courseName: course.title,
      tier: course.tier,
      tagName: course.tagName,
      provider: course.provider,
      isManufacturer: course.isManufacturer,
      techFocus: course.techFocus,
      verificationId: `QUIPP-${randomToken(4).toUpperCase()}`,
      quizScore: null,
      skillsDemonstrated: course.technicalCompetencies,
      techScoreContribution: course.techScoreContribution,
    });
    credentialId = String(cred._id);
    await refreshTechScore(String(doc.userId));
  }

  doc.status = 'approved';
  doc.reviewedBy = reviewerId as unknown as typeof doc.reviewedBy;
  doc.reviewedAt = new Date();
  if (reviewNotes) doc.reviewNotes = reviewNotes;
  doc.issuedCredentialId = credentialId as unknown as typeof doc.issuedCredentialId;
  await doc.save();

  const h = doc as unknown as HydratedSub;
  h.__courseTitle = course.title;
  return toPublic(h);
}

export async function reject(
  id: string,
  reviewerId: string,
  reviewNotes?: string,
): Promise<PublicDeepSubmission> {
  const doc = await findSubmission(id);
  if (doc.status !== 'pending') {
    throw new HttpError(409, `Submission is already ${doc.status}`);
  }
  doc.status = 'rejected';
  doc.reviewedBy = reviewerId as unknown as typeof doc.reviewedBy;
  doc.reviewedAt = new Date();
  if (reviewNotes) doc.reviewNotes = reviewNotes;
  await doc.save();

  const course = await Course.findById(doc.deepCourseId).select({ title: 1 }).lean();
  const h = doc as unknown as HydratedSub;
  h.__courseTitle = course?.title ?? '';
  return toPublic(h);
}
