import { CourseAssignment } from '../../../models/CourseAssignment.js';
import { OrganizationMembership } from '../../../models/OrganizationMembership.js';
import { Operator } from '../../../models/Operator.js';
import { OperatorLocation } from '../../../models/OperatorLocation.js';
import { WorkplaceLink } from '../../../models/WorkplaceLink.js';

export interface BusinessTrainingStatus {
  organization: string;
  activeWorkers: number;
  locations: number;
  assignments: {
    assigned: number;
    inProgress: number;
    completed: number;
    total: number;
  };
}

export async function getBusinessTrainingStatus(
  requestingUserId: string | null,
): Promise<BusinessTrainingStatus> {
  if (!requestingUserId) {
    throw new Error('Authenticated operator access is required');
  }

  let operator = await Operator.findOne({ ownerUserId: requestingUserId })
    .select({ companyName: 1 })
    .lean();
  if (!operator) {
    const membership = await OrganizationMembership.findOne({
      userId: requestingUserId,
      status: 'active',
    })
      .select({ operatorId: 1 })
      .lean();
    if (!membership) throw new Error('Operator access is required');
    operator = await Operator.findById(membership.operatorId)
      .select({ companyName: 1 })
      .lean();
  }
  if (!operator) throw new Error('Operator access is required');

  const [counts, activeWorkers, locations] = await Promise.all([
    CourseAssignment.aggregate<{ _id: string; count: number }>([
      { $match: { operatorId: operator._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    WorkplaceLink.countDocuments({ operatorId: operator._id, status: 'active' }),
    OperatorLocation.countDocuments({ operatorId: operator._id }),
  ]);

  const assignments = { assigned: 0, inProgress: 0, completed: 0, total: 0 };
  for (const count of counts) {
    assignments.total += count.count;
    if (count._id === 'assigned') assignments.assigned = count.count;
    if (count._id === 'in_progress') assignments.inProgress = count.count;
    if (count._id === 'completed') assignments.completed = count.count;
  }

  return {
    organization: operator.companyName,
    activeWorkers,
    locations,
    assignments,
  };
}
