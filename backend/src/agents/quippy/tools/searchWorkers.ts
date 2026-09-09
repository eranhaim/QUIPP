import type { FilterQuery } from 'mongoose';
import { Credential } from '../../../models/Credential.js';
import { Profile } from '../../../models/Profile.js';
import { WorkerTechDeclaration } from '../../../models/WorkerTechDeclaration.js';
import type { IntentFilters } from '../state.js';

const TIER_RANK = { IN: 1, DEEP: 2, THERE: 3 } as const;
const RESULT_CAP = 25;

function escaped(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export interface PublicWorkerSummary {
  username: string;
  avatarUrl: string | null;
  techProficiencyScore: number;
  location: string | null;
  baseRole: string | null;
  techRole: string | null;
  specialty: string | null;
  yearsExperience: number;
  credentials: Array<{ title: string; tier: string; tag: string }>;
  equipment: Array<{ name: string; brand: string | null; verified: boolean }>;
}

export async function searchWorkers(
  filters: IntentFilters,
  limit = RESULT_CAP,
): Promise<PublicWorkerSummary[]> {
  const cappedLimit = Math.max(1, Math.min(limit, RESULT_CAP));
  const profileQuery: FilterQuery<unknown> = {
    visibilityStatus: 'open',
  };

  if (filters.candidateUsername) {
    profileQuery.username = filters.candidateUsername.toLowerCase();
  }
  if (filters.location) profileQuery.location = escaped(filters.location);
  if (filters.baseRole) profileQuery.baseRole = filters.baseRole;
  if (filters.query) {
    const query = escaped(filters.query);
    profileQuery.$or = [
      { username: query },
      { techRole: query },
      { specialty: query },
      { baseRole: query },
    ];
  }

  let eligibleUserIds: string[] | null = null;
  if (filters.credentialTier || filters.tag) {
    const credentialQuery: FilterQuery<unknown> = { status: 'active' };
    if (filters.tag) credentialQuery.tagName = escaped(filters.tag);
    const credentials = await Credential.find(credentialQuery)
      .select({ userId: 1, tier: 1 })
      .lean();
    eligibleUserIds = credentials
      .filter((credential) => {
        if (!filters.credentialTier) return true;
        return (
          TIER_RANK[credential.tier] >= TIER_RANK[filters.credentialTier]
        );
      })
      .map((credential) => String(credential.userId));
  }

  if (filters.equipment) {
    const declarations = await WorkerTechDeclaration.find({
      $or: [
        { equipmentName: escaped(filters.equipment) },
        { brand: escaped(filters.equipment) },
      ],
    })
      .select({ userId: 1 })
      .lean();
    const equipmentIds = new Set(declarations.map((item) => String(item.userId)));
    eligibleUserIds =
      eligibleUserIds === null
        ? [...equipmentIds]
        : eligibleUserIds.filter((id) => equipmentIds.has(id));
  }

  if (eligibleUserIds !== null) profileQuery.userId = { $in: eligibleUserIds };

  const profiles = await Profile.find(profileQuery)
    .select({
      userId: 1,
      username: 1,
      avatarUrl: 1,
      techProficiencyScore: 1,
      location: 1,
      baseRole: 1,
      techRole: 1,
      specialty: 1,
      yearsExperience: 1,
    })
    .sort({ techProficiencyScore: -1, yearsExperience: -1 })
    .limit(cappedLimit)
    .lean();

  const userIds = profiles.map((profile) => profile.userId);
  const [credentials, declarations] = await Promise.all([
    Credential.find({ userId: { $in: userIds }, status: 'active' })
      .select({ userId: 1, courseName: 1, tier: 1, tagName: 1 })
      .limit(cappedLimit * 10)
      .lean(),
    WorkerTechDeclaration.find({ userId: { $in: userIds } })
      .select({ userId: 1, equipmentName: 1, brand: 1, verified: 1 })
      .limit(cappedLimit * 10)
      .lean(),
  ]);

  return profiles.map((profile) => ({
    username: profile.username,
    avatarUrl: profile.avatarUrl ?? null,
    techProficiencyScore: profile.techProficiencyScore,
    location: profile.location ?? null,
    baseRole: profile.baseRole ?? null,
    techRole: profile.techRole ?? null,
    specialty: profile.specialty ?? null,
    yearsExperience: profile.yearsExperience,
    credentials: credentials
      .filter((credential) => String(credential.userId) === String(profile.userId))
      .slice(0, 5)
      .map((credential) => ({
        title: credential.courseName,
        tier: credential.tier,
        tag: credential.tagName,
      })),
    equipment: declarations
      .filter((item) => String(item.userId) === String(profile.userId))
      .slice(0, 5)
      .map((item) => ({
        name: item.equipmentName,
        brand: item.brand ?? null,
        verified: item.verified,
      })),
  }));
}
