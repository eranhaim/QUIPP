import { createLead } from '../../../services/lead.service.js';
import type { IntentFilters } from '../state.js';

export async function createConfirmedLead(userId: string, filters: IntentFilters) {
  if (
    !filters.category ||
    !filters.city ||
    filters.budgetMaxCents === undefined ||
    !filters.requirements
  ) {
    return { ok: false as const, error: 'preview_context_missing' };
  }
  const lead = await createLead(userId, {
    category: filters.category,
    city: filters.city,
    region: filters.region ?? filters.city,
    budgetMaxCents: filters.budgetMaxCents,
    currency: filters.currency ?? 'USD',
    requirements: filters.requirements,
    urgency: 'normal',
    consentedFields: [
      'category',
      'city',
      'region',
      'budgetMaxCents',
      'currency',
      'requirements',
      'urgency',
      'requesterEmail',
    ],
  });
  return { ok: true as const, lead };
}
