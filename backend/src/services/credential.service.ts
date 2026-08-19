import { Credential } from '../models/Credential.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

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

export async function listCredentialsByUsername(username: string): Promise<PublicCredential[]> {
  const profile = await Profile.findOne({ username: username.toLowerCase() });
  if (!profile) throw new HttpError(404, 'Profile not found');
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
  if (!profile || !user) throw new HttpError(404, 'Credential holder not found');

  return {
    credential: toPublic(cred.toObject() as never),
    holder: {
      username: profile.username,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    },
  };
}
