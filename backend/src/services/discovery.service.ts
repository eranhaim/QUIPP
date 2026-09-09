import { HttpError } from '../middleware/errorHandler.js';
import {
  searchWorkers,
  type PublicWorkerSummary,
} from '../agents/quippy/tools/searchWorkers.js';
import type { BaseRole } from '../models/Profile.js';

export interface DiscoveryFilters {
  location?: string;
  baseRole?: BaseRole;
  tier?: 'IN' | 'DEEP' | 'THERE';
  tag?: string;
  equipment?: string;
  q?: string;
  limit?: number;
}

export async function discoverWorkers(
  filters: DiscoveryFilters,
): Promise<PublicWorkerSummary[]> {
  return searchWorkers(
    {
      location: filters.location,
      baseRole: filters.baseRole,
      credentialTier: filters.tier,
      tag: filters.tag,
      equipment: filters.equipment,
      query: filters.q,
    },
    filters.limit ?? 20,
  );
}

export async function getDiscoveredWorker(
  username: string,
): Promise<PublicWorkerSummary> {
  const [worker] = await searchWorkers(
    { candidateUsername: username.toLowerCase() },
    1,
  );
  if (!worker) throw new HttpError(404, 'Discoverable worker not found');
  return worker;
}
