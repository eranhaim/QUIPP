import { isValidObjectId } from 'mongoose';
import { Course } from '../models/Course.js';
import { CourseAssignment } from '../models/CourseAssignment.js';
import { CourseEnrollment } from '../models/CourseEnrollment.js';
import { Credential } from '../models/Credential.js';
import {
  OrganizationMembership,
  type OrganizationRole,
} from '../models/OrganizationMembership.js';
import { Operator } from '../models/Operator.js';
import { OperatorLocation } from '../models/OperatorLocation.js';
import { Profile, type BaseRole } from '../models/Profile.js';
import { TrainingRequirement } from '../models/TrainingRequirement.js';
import { User } from '../models/User.js';
import { WorkplaceLink } from '../models/WorkplaceLink.js';
import { HttpError } from '../middleware/errorHandler.js';

export interface SetupOperatorInput {
  companyName: string;
  businessType: string;
  staffSize: number;
  hqLocation: string;
  locationName: string;
  city: string;
  country: string;
  timezone: string;
}

export interface CreateLocationInput {
  name: string;
  code: string;
  address?: string | null;
  city: string;
  country: string;
  timezone: string;
}

export interface CreateRequirementInput {
  locationId?: string | null;
  baseRole?: BaseRole | null;
  courseId?: string;
  courseSlug?: string;
  required?: boolean;
}

export interface CreateAssignmentInput {
  locationId?: string | null;
  workerId: string;
  courseId?: string;
  courseSlug?: string;
}

interface OperatorAccess {
  operator: InstanceType<typeof Operator>;
  membership: {
    id: string;
    role: OrganizationRole;
    status: 'active';
  };
}

function requireObjectId(value: string, field: string): void {
  if (!isValidObjectId(value)) throw new HttpError(400, `Invalid ${field}`);
}

function locationCode(name: string): string {
  const code = name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .toUpperCase()
    .slice(0, 24);
  return code || 'HQ';
}

export async function getOperatorAccess(userId: string): Promise<OperatorAccess> {
  const ownedOperator = await Operator.findOne({ ownerUserId: userId });
  if (ownedOperator) {
    const membership = await OrganizationMembership.findOneAndUpdate(
      { operatorId: ownedOperator._id, userId },
      { $set: { role: 'owner', status: 'active' } },
      { upsert: true, new: true },
    );
    return {
      operator: ownedOperator,
      membership: { id: String(membership._id), role: 'owner', status: 'active' },
    };
  }

  const membership = await OrganizationMembership.findOne({ userId, status: 'active' });
  if (!membership) throw new HttpError(404, 'Operator organization not found');
  const operator = await Operator.findById(membership.operatorId);
  if (!operator) throw new HttpError(404, 'Operator organization not found');

  return {
    operator,
    membership: {
      id: String(membership._id),
      role: membership.role,
      status: 'active',
    },
  };
}

async function canAccessOperator(userId: string, operatorId: unknown): Promise<boolean> {
  const operator = await Operator.exists({ _id: operatorId, ownerUserId: userId });
  if (operator) return true;
  const membership = await OrganizationMembership.exists({
    operatorId,
    userId,
    status: 'active',
  });
  return Boolean(membership);
}

async function requireOwnedLocation(
  operatorId: unknown,
  locationId?: string | null,
): Promise<InstanceType<typeof OperatorLocation> | null> {
  if (!locationId) return null;
  requireObjectId(locationId, 'locationId');
  const location = await OperatorLocation.findOne({ _id: locationId, operatorId });
  if (!location) throw new HttpError(404, 'Location not found');
  return location;
}

async function findCourse(input: { courseId?: string; courseSlug?: string }) {
  let course = null;
  if (input.courseId) {
    requireObjectId(input.courseId, 'courseId');
    course = await Course.findById(input.courseId);
  } else if (input.courseSlug) {
    course = await Course.findOne({ slug: input.courseSlug.toLowerCase() });
  }
  if (!course) throw new HttpError(404, 'Course not found');
  return course;
}

export async function setupOperator(userId: string, input: SetupOperatorInput) {
  const now = new Date();
  const operator = await Operator.findOneAndUpdate(
    { ownerUserId: userId },
    {
      $set: {
        companyName: input.companyName,
        businessType: input.businessType,
        staffSize: input.staffSize,
        hqLocation: input.hqLocation,
        onboardingCompletedAt: now,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  const membership = await OrganizationMembership.findOneAndUpdate(
    { operatorId: operator._id, userId },
    { $set: { role: 'owner', status: 'active' } },
    { upsert: true, new: true, runValidators: true },
  );

  let location = await OperatorLocation.findOne({ operatorId: operator._id }).sort({
    createdAt: 1,
  });
  if (location) {
    location.name = input.locationName;
    location.city = input.city;
    location.country = input.country;
    location.timezone = input.timezone;
    await location.save();
  } else {
    location = await OperatorLocation.create({
      operatorId: operator._id,
      name: input.locationName,
      code: locationCode(input.locationName),
      city: input.city,
      country: input.country,
      timezone: input.timezone,
    });
  }

  await User.updateOne({ _id: userId }, { $addToSet: { roles: 'operator' } });

  return {
    operator,
    membership: {
      id: String(membership._id),
      role: membership.role,
      status: membership.status,
    },
    location,
  };
}

export async function getMyOperator(userId: string) {
  const access = await getOperatorAccess(userId);
  return {
    operator: access.operator,
    membership: access.membership,
  };
}

export async function getOperatorOverview(userId: string) {
  const { operator } = await getOperatorAccess(userId);
  const [staffCounts, locations, assignmentCounts] = await Promise.all([
    WorkplaceLink.aggregate<{ _id: string; count: number }>([
      { $match: { operatorId: operator._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OperatorLocation.countDocuments({ operatorId: operator._id }),
    CourseAssignment.aggregate<{ _id: string; count: number }>([
      { $match: { operatorId: operator._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const staff = { pending: 0, active: 0, declined: 0, unlinked: 0, total: 0 };
  for (const item of staffCounts) {
    if (item._id === 'pending') staff.pending = item.count;
    if (item._id === 'active') staff.active = item.count;
    if (item._id === 'declined') staff.declined = item.count;
    if (item._id === 'unlinked') staff.unlinked = item.count;
    staff.total += item.count;
  }

  const assignments = { assigned: 0, inProgress: 0, completed: 0, total: 0 };
  for (const item of assignmentCounts) {
    if (item._id === 'assigned') assignments.assigned = item.count;
    if (item._id === 'in_progress') assignments.inProgress = item.count;
    if (item._id === 'completed') assignments.completed = item.count;
    assignments.total += item.count;
  }

  return {
    operatorId: String(operator._id),
    staff,
    locations,
    assignments,
  };
}

export async function listOperatorLocations(userId: string) {
  const { operator } = await getOperatorAccess(userId);
  return OperatorLocation.find({ operatorId: operator._id }).sort({ name: 1 });
}

export async function createOperatorLocation(userId: string, input: CreateLocationInput) {
  const { operator } = await getOperatorAccess(userId);
  const duplicate = await OperatorLocation.exists({
    operatorId: operator._id,
    code: input.code.toUpperCase(),
  });
  if (duplicate) throw new HttpError(409, 'Location code already exists');

  return OperatorLocation.create({
    operatorId: operator._id,
    ...input,
    code: input.code.toUpperCase(),
  });
}

export async function listOperatorRoster(userId: string) {
  const { operator } = await getOperatorAccess(userId);
  const links = await WorkplaceLink.find({
    operatorId: operator._id,
    status: 'active',
  }).sort({ updatedAt: -1 });
  const workerIds = links.map((link) => link.workerId);
  if (workerIds.length === 0) return [];

  const [users, profiles, credentials] = await Promise.all([
    User.find({ _id: { $in: workerIds } }).select('firstName lastName email'),
    Profile.find({ userId: { $in: workerIds } }).select(
      'userId username avatarUrl techProficiencyScore techRole baseRole specialty yearsExperience',
    ),
    Credential.find({ userId: { $in: workerIds } })
      .select('userId courseSlug courseName tier tagName provider earnedDate status')
      .sort({ earnedDate: -1 }),
  ]);

  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  const credentialMap = new Map<string, typeof credentials>();
  for (const credential of credentials) {
    const key = String(credential.userId);
    const values = credentialMap.get(key) ?? [];
    values.push(credential);
    credentialMap.set(key, values);
  }

  return links.map((link) => {
    const key = String(link.workerId);
    const worker = userMap.get(key);
    const profile = profileMap.get(key);
    const workerCredentials = credentialMap.get(key) ?? [];
    return {
      link: {
        id: String(link._id),
        workerId: key,
        locationId: link.locationId ? String(link.locationId) : null,
        status: link.status,
        linkedAt: link.updatedAt,
      },
      worker: {
        firstName: worker?.firstName ?? null,
        lastName: worker?.lastName ?? null,
        email: worker?.email ?? null,
        profile: profile
          ? {
              username: profile.username,
              avatarUrl: profile.avatarUrl,
              techProficiencyScore: profile.techProficiencyScore,
              techRole: profile.techRole,
              baseRole: profile.baseRole,
              specialty: profile.specialty,
              yearsExperience: profile.yearsExperience,
            }
          : null,
        credentials: workerCredentials.map((credential) => ({
          courseSlug: credential.courseSlug,
          courseName: credential.courseName,
          tier: credential.tier,
          tagName: credential.tagName,
          provider: credential.provider,
          earnedDate: credential.earnedDate,
          status: credential.status,
        })),
      },
    };
  });
}

export async function inviteWorker(
  userId: string,
  input: { email: string; locationId?: string | null },
) {
  const { operator } = await getOperatorAccess(userId);
  const location = await requireOwnedLocation(operator._id, input.locationId);
  const worker = await User.findOne({ email: input.email.toLowerCase() });
  if (!worker) throw new HttpError(404, 'User not found');

  const existing = await WorkplaceLink.findOne({
    operatorId: operator._id,
    workerId: worker._id,
  });
  if (existing?.status === 'active') throw new HttpError(409, 'Worker is already linked');

  return WorkplaceLink.findOneAndUpdate(
    { operatorId: operator._id, workerId: worker._id },
    {
      $set: {
        locationId: location?._id ?? null,
        status: 'pending',
        invitedBy: userId,
        operatorVisibilityEndsAt: null,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function listMyWorkplaceLinks(userId: string) {
  return WorkplaceLink.find({ workerId: userId })
    .populate('operatorId', 'companyName businessType hqLocation')
    .populate('locationId', 'name code city country')
    .sort({ updatedAt: -1 });
}

export async function acceptWorkplaceLink(userId: string, linkId: string) {
  requireObjectId(linkId, 'workplace link id');
  const link = await WorkplaceLink.findOneAndUpdate(
    { _id: linkId, workerId: userId, status: 'pending' },
    {
      $set: {
        status: 'active',
        operatorVisibilityEndsAt: null,
      },
    },
    { new: true },
  );
  if (!link) throw new HttpError(404, 'Pending workplace invitation not found');
  return link;
}

export async function declineWorkplaceLink(userId: string, linkId: string) {
  requireObjectId(linkId, 'workplace link id');
  const now = new Date();
  const link = await WorkplaceLink.findOneAndUpdate(
    { _id: linkId, workerId: userId, status: 'pending' },
    { $set: { status: 'declined', operatorVisibilityEndsAt: now } },
    { new: true },
  );
  if (!link) throw new HttpError(404, 'Pending workplace invitation not found');
  return link;
}

export async function unlinkWorkplace(userId: string, linkId: string) {
  requireObjectId(linkId, 'workplace link id');
  const link = await WorkplaceLink.findById(linkId);
  if (!link) throw new HttpError(404, 'Workplace link not found');

  const isWorker = String(link.workerId) === userId;
  if (!isWorker && !(await canAccessOperator(userId, link.operatorId))) {
    throw new HttpError(403, 'Forbidden');
  }

  link.status = 'unlinked';
  link.operatorVisibilityEndsAt = new Date();
  await link.save();
  return link;
}

export async function listTrainingRequirements(userId: string) {
  const { operator } = await getOperatorAccess(userId);
  return TrainingRequirement.find({ operatorId: operator._id })
    .populate('courseId', 'slug title tier tagName status')
    .sort({ createdAt: -1 });
}

export async function createTrainingRequirement(
  userId: string,
  input: CreateRequirementInput,
) {
  const { operator } = await getOperatorAccess(userId);
  const [location, course] = await Promise.all([
    requireOwnedLocation(operator._id, input.locationId),
    findCourse(input),
  ]);

  return TrainingRequirement.findOneAndUpdate(
    {
      operatorId: operator._id,
      locationId: location?._id ?? null,
      baseRole: input.baseRole ?? null,
      courseId: course._id,
    },
    { $set: { required: input.required ?? true } },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function listCourseAssignments(userId: string) {
  const { operator } = await getOperatorAccess(userId);
  return CourseAssignment.find({ operatorId: operator._id })
    .populate('workerId', 'firstName lastName email')
    .populate('courseId', 'slug title tier tagName status')
    .sort({ assignedAt: -1 });
}

export async function createCourseAssignment(userId: string, input: CreateAssignmentInput) {
  requireObjectId(input.workerId, 'workerId');
  const { operator } = await getOperatorAccess(userId);
  const [requestedLocation, course, link] = await Promise.all([
    requireOwnedLocation(operator._id, input.locationId),
    findCourse(input),
    WorkplaceLink.findOne({
      operatorId: operator._id,
      workerId: input.workerId,
      status: 'active',
    }),
  ]);
  if (!link) throw new HttpError(400, 'Worker must have an active workplace link');
  if (
    requestedLocation &&
    link.locationId &&
    String(requestedLocation._id) !== String(link.locationId)
  ) {
    throw new HttpError(400, 'Worker is not linked to the requested location');
  }

  const existing = await CourseAssignment.findOne({
    operatorId: operator._id,
    workerId: input.workerId,
    courseId: course._id,
  });
  if (existing) return existing;

  const enrollment = await CourseEnrollment.findOne({
    userId: input.workerId,
    courseId: course._id,
  });
  const status =
    enrollment?.status === 'completed'
      ? 'completed'
      : enrollment
        ? 'in_progress'
        : 'assigned';

  return CourseAssignment.create({
    operatorId: operator._id,
    locationId: requestedLocation?._id ?? link.locationId ?? null,
    workerId: input.workerId,
    courseId: course._id,
    courseSlug: course.slug,
    assignedBy: userId,
    status,
    assignedAt: new Date(),
    startedAt: enrollment?.startedAt ?? null,
    completedAt: enrollment?.completedAt ?? null,
  });
}
