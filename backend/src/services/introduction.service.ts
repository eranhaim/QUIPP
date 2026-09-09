import { Types } from 'mongoose';
import { Introduction } from '../models/Introduction.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

const REQUEST_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000;

function escaped(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

async function expirePending(userId?: string): Promise<void> {
  const now = new Date();
  const participant = userId
    ? {
        $or: [
          { requesterUserId: new Types.ObjectId(userId) },
          { candidateUserId: new Types.ObjectId(userId) },
        ],
      }
    : {};
  await Introduction.updateMany(
    { ...participant, status: 'pending', expiresAt: { $lte: now } },
    { $set: { status: 'expired', respondedAt: now } },
  );
}

export interface PublicIntroduction {
  id: string;
  direction: 'incoming' | 'outgoing';
  purpose: string;
  approvedChannel: 'email';
  status: string;
  requesterConsentedAt: string;
  candidateConsentedAt: string | null;
  respondedAt: string | null;
  expiresAt: string;
  outcome: string | null;
  helpful: boolean | null;
  reportReason: string | null;
  createdAt: string;
  counterpart: {
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    email?: string;
  };
}

async function serializeIntroduction(
  introduction: InstanceType<typeof Introduction>,
  viewerUserId: string,
): Promise<PublicIntroduction> {
  const outgoing = String(introduction.requesterUserId) === viewerUserId;
  const counterpartId = outgoing
    ? introduction.candidateUserId
    : introduction.requesterUserId;
  const [profile, user] = await Promise.all([
    Profile.findOne({ userId: counterpartId })
      .select({ username: 1, avatarUrl: 1 })
      .lean(),
    User.findById(counterpartId)
      .select({ firstName: 1, lastName: 1, email: 1 })
      .lean(),
  ]);
  if (!profile || !user) throw new HttpError(404, 'Introduction participant not found');

  const counterpart: PublicIntroduction['counterpart'] = {
    username: profile.username,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
  };
  if (introduction.status === 'connected') counterpart.email = user.email;

  return {
    id: String(introduction._id),
    direction: outgoing ? 'outgoing' : 'incoming',
    purpose: introduction.purpose,
    approvedChannel: introduction.approvedChannel,
    status: introduction.status,
    requesterConsentedAt: introduction.requesterConsentedAt.toISOString(),
    candidateConsentedAt: introduction.candidateConsentedAt?.toISOString() ?? null,
    respondedAt: introduction.respondedAt?.toISOString() ?? null,
    expiresAt: introduction.expiresAt.toISOString(),
    outcome: introduction.outcome ?? null,
    helpful: introduction.helpful ?? null,
    reportReason:
      String(introduction.reportedByUserId ?? '') === viewerUserId
        ? introduction.reportReason ?? null
        : null,
    createdAt: introduction.createdAt.toISOString(),
    counterpart,
  };
}

export async function createIntroduction(input: {
  requesterUserId: string;
  candidateUsername: string;
  purpose: string;
  approvedChannel: 'email';
}): Promise<PublicIntroduction> {
  const requesterId = new Types.ObjectId(input.requesterUserId);
  const candidate = await Profile.findOne({
    username: input.candidateUsername.toLowerCase(),
    visibilityStatus: 'open',
  })
    .select({ userId: 1 })
    .lean();
  if (!candidate) throw new HttpError(404, 'Candidate is not open for introductions');
  if (String(candidate.userId) === input.requesterUserId) {
    throw new HttpError(400, 'You cannot request an introduction to yourself');
  }

  await expirePending();
  const purpose = input.purpose.trim().replace(/\s+/g, ' ');
  const pair = [
    { requesterUserId: requesterId, candidateUserId: candidate.userId },
    { requesterUserId: candidate.userId, candidateUserId: requesterId },
  ];
  const duplicate = await Introduction.exists({
    $or: pair,
    purpose: escaped(purpose),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
  if (duplicate) {
    throw new HttpError(409, 'An active introduction request already exists for this purpose');
  }

  try {
    const introduction = await Introduction.create({
      requesterUserId: requesterId,
      candidateUserId: candidate.userId,
      purpose,
      approvedChannel: input.approvedChannel,
      requesterConsentedAt: new Date(),
      expiresAt: new Date(Date.now() + REQUEST_LIFETIME_MS),
    });
    return serializeIntroduction(introduction, input.requesterUserId);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new HttpError(409, 'An active introduction request already exists for this purpose');
    }
    throw error;
  }
}

export async function getMyIntroductions(userId: string): Promise<{
  incoming: PublicIntroduction[];
  outgoing: PublicIntroduction[];
}> {
  await expirePending(userId);
  const introductions = await Introduction.find({
    $or: [{ requesterUserId: userId }, { candidateUserId: userId }],
  }).sort({ createdAt: -1 });
  const serialized = await Promise.all(
    introductions.map((item) => serializeIntroduction(item, userId)),
  );
  return {
    incoming: serialized.filter((item) => item.direction === 'incoming'),
    outgoing: serialized.filter((item) => item.direction === 'outgoing'),
  };
}

async function getParticipantIntroduction(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, 'Introduction not found');
  await expirePending(userId);
  const introduction = await Introduction.findOne({
    _id: id,
    $or: [{ requesterUserId: userId }, { candidateUserId: userId }],
  });
  if (!introduction) throw new HttpError(404, 'Introduction not found');
  return introduction;
}

export async function acceptIntroduction(id: string, userId: string) {
  const introduction = await getParticipantIntroduction(id, userId);
  if (String(introduction.candidateUserId) !== userId) {
    throw new HttpError(403, 'Only the candidate can accept this request');
  }
  if (introduction.status !== 'pending') {
    throw new HttpError(409, `This request is ${introduction.status}`);
  }
  const now = new Date();
  introduction.status = 'connected';
  introduction.candidateConsentedAt = now;
  introduction.respondedAt = now;
  await introduction.save();
  return serializeIntroduction(introduction, userId);
}

export async function declineIntroduction(id: string, userId: string) {
  const introduction = await getParticipantIntroduction(id, userId);
  if (String(introduction.candidateUserId) !== userId) {
    throw new HttpError(403, 'Only the candidate can decline this request');
  }
  if (introduction.status !== 'pending') throw new HttpError(409, `This request is ${introduction.status}`);
  introduction.status = 'declined';
  introduction.respondedAt = new Date();
  await introduction.save();
  return serializeIntroduction(introduction, userId);
}

export async function cancelIntroduction(id: string, userId: string) {
  const introduction = await getParticipantIntroduction(id, userId);
  if (String(introduction.requesterUserId) !== userId) {
    throw new HttpError(403, 'Only the requester can cancel this request');
  }
  if (introduction.status !== 'pending') throw new HttpError(409, `This request is ${introduction.status}`);
  introduction.status = 'cancelled';
  introduction.respondedAt = new Date();
  await introduction.save();
  return serializeIntroduction(introduction, userId);
}

export async function reportIntroduction(id: string, userId: string, reason: string) {
  const introduction = await getParticipantIntroduction(id, userId);
  if (introduction.status === 'reported') throw new HttpError(409, 'This introduction was already reported');
  introduction.status = 'reported';
  introduction.reportReason = reason.trim();
  introduction.reportedByUserId = new Types.ObjectId(userId);
  introduction.respondedAt ??= new Date();
  await introduction.save();
  return serializeIntroduction(introduction, userId);
}

export async function recordIntroductionOutcome(
  id: string,
  userId: string,
  input: { helpful: boolean; outcome?: string },
) {
  const introduction = await getParticipantIntroduction(id, userId);
  if (introduction.status !== 'connected') {
    throw new HttpError(409, 'Outcome can only be recorded for a connected introduction');
  }
  introduction.helpful = input.helpful;
  if (input.outcome !== undefined) introduction.outcome = input.outcome.trim();
  await introduction.save();
  return serializeIntroduction(introduction, userId);
}
