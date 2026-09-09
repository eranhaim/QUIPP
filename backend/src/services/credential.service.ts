import { Credential } from '../models/Credential.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';
import { randomToken } from '../lib/crypto.js';
import { refreshTechScore } from './profile.service.js';

export interface PublicCredential {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseName: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  tagName: string;
  provider: string;
  isManufacturer: boolean;
  techFocus: string;
  earnedDate: string;
  verificationId: string;
  quizScore: number | null;
  skillsDemonstrated: string[];
  techScoreContribution: number;
  status: 'active' | 'update_available';
}

function toPublic(c: {
  _id: unknown;
  userId: unknown;
  courseId: unknown;
  courseSlug: string;
  courseName: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  tagName: string;
  provider: string;
  isManufacturer: boolean;
  techFocus: string;
  earnedDate: Date;
  verificationId: string;
  quizScore: number | null;
  skillsDemonstrated: string[];
  techScoreContribution: number;
  status: 'active' | 'update_available';
}): PublicCredential {
  return {
    id: String(c._id),
    userId: String(c.userId),
    courseId: String(c.courseId),
    courseSlug: c.courseSlug,
    courseName: c.courseName,
    tier: c.tier,
    tagName: c.tagName,
    provider: c.provider,
    isManufacturer: c.isManufacturer,
    techFocus: c.techFocus,
    earnedDate: c.earnedDate.toISOString(),
    verificationId: c.verificationId,
    quizScore: c.quizScore,
    skillsDemonstrated: c.skillsDemonstrated,
    techScoreContribution: c.techScoreContribution,
    status: c.status,
  };
}

export async function listCredentialsForUser(userId: string): Promise<PublicCredential[]> {
  const docs = await Credential.find({ userId }).sort({ earnedDate: -1 });
  return docs.map((d) => toPublic(d.toObject() as never));
}

interface CredentialCourse {
  _id: unknown;
  slug: string;
  title: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  tagName: string;
  provider: string;
  isManufacturer: boolean;
  techFocus: string;
  technicalCompetencies: string[];
  techScoreContribution: number;
}

export async function issueCourseCredential(
  userId: string,
  course: CredentialCourse,
  quizScore: number | null,
): Promise<InstanceType<typeof Credential>> {
  const existing = await Credential.findOne({ userId, courseSlug: course.slug });
  if (existing) return existing;

  try {
    const credential = await Credential.create({
      userId,
      courseId: course._id,
      courseSlug: course.slug,
      courseName: course.title,
      tier: course.tier,
      tagName: course.tagName,
      provider: course.provider,
      isManufacturer: course.isManufacturer,
      techFocus: course.techFocus,
      verificationId: `QUIPP-${randomToken(8).toUpperCase()}`,
      quizScore,
      skillsDemonstrated: course.technicalCompetencies,
      techScoreContribution: course.techScoreContribution,
    });
    await refreshTechScore(userId);
    return credential;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const racedCredential = await Credential.findOne({ userId, courseSlug: course.slug });
      if (racedCredential) return racedCredential;
    }
    throw error;
  }
}

export async function listCredentialsByUsername(username: string): Promise<PublicCredential[]> {
  const profile = await Profile.findOne({ username: username.toLowerCase() });
  if (!profile || profile.visibilityStatus === 'private') {
    throw new HttpError(404, 'Profile not found');
  }
  return listCredentialsForUser(String(profile.userId));
}

export interface VerifyResult {
  credential: PublicCredential;
  holder: {
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function verifyCredentialById(verificationId: string): Promise<VerifyResult> {
  const cred = await Credential.findOne({ verificationId: verificationId.toUpperCase() });
  if (!cred) throw new HttpError(404, 'Credential not found');

  const profile = await Profile.findOne({ userId: cred.userId });
  const user = await User.findById(cred.userId).select('firstName lastName');
  if (!profile || !user || profile.visibilityStatus === 'private') {
    throw new HttpError(404, 'Credential not found');
  }

  return {
    credential: toPublic(cred.toObject() as never),
    holder: {
      username: profile.username,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    },
  };
}
