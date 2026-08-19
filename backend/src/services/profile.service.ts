import { Profile, type BaseRole, type VisibilityStatus } from '../models/Profile.js';
import { Credential } from '../models/Credential.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';
import { computeTechScore, deriveTechRole, getTechScoreLabel } from './techScore.service.js';

const RESERVED_HANDLES = new Set([
  'me',
  'admin',
  'root',
  'quipp',
  'quippy',
  'api',
  'app',
  'www',
  'signup',
  'login',
  'academy',
  'operator',
  'manufacturer',
  'workplace',
  'settings',
  'passport',
]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

/**
 * Turn a first name / email prefix into a unique, URL-safe, non-reserved handle.
 * Adds a numeric suffix until the handle is unique.
 */
export async function generateUniqueUsername(seed: string): Promise<string> {
  const base = slugify(seed) || 'quipper';
  const isForbidden = (u: string) => RESERVED_HANDLES.has(u) || u.length < 2;

  let candidate = isForbidden(base) ? `${base}1` : base;
  let suffix = 1;

  while (true) {
    const collision = await Profile.exists({ username: candidate });
    if (!collision && !isForbidden(candidate)) return candidate;
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
}

export interface CreateProfileInput {
  userId: string;
  firstName?: string | null;
  email: string;
}

export async function createProfileForUser(input: CreateProfileInput) {
  const seed = input.firstName?.trim() || input.email.split('@')[0];
  const username = await generateUniqueUsername(seed);
  const profile = await Profile.create({
    userId: input.userId,
    username,
    techProficiencyScore: 0,
  });
  return profile;
}

export interface PublicProfile {
  id: string;
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  techProficiencyScore: number;
  techScoreLabel: string;
  techRole: string | null;
  baseRole: BaseRole | null;
  specialty: string | null;
  yearsExperience: number;
  location: string | null;
  visibilityStatus: VisibilityStatus;
}

async function assemblePublicProfile(
  profile: { _id: unknown; userId: unknown; username: string; avatarUrl: string | null; techProficiencyScore: number; techRole: string | null; baseRole: BaseRole | null; specialty: string | null; yearsExperience: number; location: string | null; visibilityStatus: VisibilityStatus },
): Promise<PublicProfile> {
  const user = await User.findById(profile.userId).select('firstName lastName');
  return {
    id: String(profile._id),
    userId: String(profile.userId),
    username: profile.username,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    techProficiencyScore: profile.techProficiencyScore,
    techScoreLabel: getTechScoreLabel(profile.techProficiencyScore),
    techRole: profile.techRole,
    baseRole: profile.baseRole,
    specialty: profile.specialty,
    yearsExperience: profile.yearsExperience,
    location: profile.location,
    visibilityStatus: profile.visibilityStatus,
  };
}

export async function getMyProfile(userId: string): Promise<PublicProfile> {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw new HttpError(404, 'Profile not found');
  return assemblePublicProfile(profile.toObject() as never);
}

export async function getProfileByUsername(username: string): Promise<PublicProfile> {
  const profile = await Profile.findOne({ username: username.toLowerCase() });
  if (!profile) throw new HttpError(404, 'Profile not found');
  return assemblePublicProfile(profile.toObject() as never);
}

export interface UpdateProfileInput {
  baseRole?: BaseRole | null;
  specialty?: string | null;
  yearsExperience?: number;
  location?: string | null;
  visibilityStatus?: VisibilityStatus;
}

export async function updateMyProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicProfile> {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw new HttpError(404, 'Profile not found');

  if (input.baseRole !== undefined) profile.baseRole = input.baseRole;
  if (input.specialty !== undefined) profile.specialty = input.specialty;
  if (input.yearsExperience !== undefined) profile.yearsExperience = input.yearsExperience;
  if (input.location !== undefined) profile.location = input.location;
  if (input.visibilityStatus !== undefined) profile.visibilityStatus = input.visibilityStatus;

  const primaryCred = await Credential.findOne({ userId }).sort({ earnedDate: -1 });
  profile.techRole = deriveTechRole(profile.baseRole ?? null, primaryCred?.tagName ?? null);

  await profile.save();
  return assemblePublicProfile(profile.toObject() as never);
}

/**
 * Recompute + persist the profile's tech score from current credentials.
 * Called whenever a credential is issued or revoked.
 */
export async function refreshTechScore(userId: string): Promise<number> {
  const credentials = await Credential.find({ userId }).select('tagName tier earnedDate');
  const score = computeTechScore(
    credentials.map((c) => ({
      tagName: c.tagName,
      tier: c.tier,
      earnedDate: c.earnedDate,
    })) as never,
  );
  await Profile.updateOne({ userId }, { $set: { techProficiencyScore: score } });
  return score;
}
