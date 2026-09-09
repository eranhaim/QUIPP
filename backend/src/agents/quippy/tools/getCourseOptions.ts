import { Course } from '../../../models/Course.js';
import { WorkplaceLink } from '../../../models/WorkplaceLink.js';
import type { IntentFilters } from '../state.js';

const RESULT_CAP = 5;

function escaped(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export interface SafeCourseOption {
  slug: string;
  title: string;
  description: string;
  tier: string;
  tag: string;
  durationMinutes: number;
  provider: string;
  priceCents: number;
}

export async function getCourseOptions(
  requestingUserId: string | null,
  filters: IntentFilters,
  limit = RESULT_CAP,
): Promise<SafeCourseOption[]> {
  const operatorIds = requestingUserId
    ? (
        await WorkplaceLink.find({
          workerId: requestingUserId,
          status: 'active',
        })
          .select({ operatorId: 1 })
          .lean()
      ).map((link) => link.operatorId)
    : [];

  const query: Record<string, unknown> = {
    status: 'published',
    reviewStatus: 'approved',
    $or: [
      { visibility: 'public' },
      { visibility: { $exists: false } },
      ...(requestingUserId
        ? [{ visibility: 'organization', ownerOperatorId: { $in: operatorIds } }]
        : []),
    ],
  };
  if (filters.credentialTier) query.tier = filters.credentialTier;
  if (filters.tag) query.tagName = escaped(filters.tag);
  if (filters.equipment) query.equipmentName = escaped(filters.equipment);
  if (filters.query) {
    const text = escaped(filters.query);
    query.$and = [
      {
        $or: [
          { title: text },
          { description: text },
          { techFocus: text },
          { tagName: text },
          { equipmentName: text },
        ],
      },
    ];
  }

  const courses = await Course.find(query)
    .select({
      slug: 1,
      title: 1,
      description: 1,
      tier: 1,
      tagName: 1,
      duration: 1,
      provider: 1,
      priceCents: 1,
    })
    .sort({ tier: 1, title: 1 })
    .limit(Math.max(1, Math.min(limit, RESULT_CAP)))
    .lean();

  return courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    description: course.description,
    tier: course.tier,
    tag: course.tagName,
    durationMinutes: course.duration,
    provider: course.provider,
    priceCents: course.priceCents,
  }));
}
