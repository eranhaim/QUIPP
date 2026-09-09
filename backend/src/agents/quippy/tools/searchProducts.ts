import { searchProducts as searchMarketplaceProducts } from '../../../services/marketplace.service.js';
import type { IntentFilters } from '../state.js';

export async function searchProducts(filters: IntentFilters) {
  return searchMarketplaceProducts({
    q: filters.query,
    category: filters.category,
    region: filters.region ?? filters.location,
    budgetCents: filters.budgetMaxCents,
    limit: 5,
  });
}
