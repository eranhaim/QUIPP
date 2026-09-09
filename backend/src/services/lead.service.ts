import { isValidObjectId } from 'mongoose';
import { ConsentRecord } from '../models/ConsentRecord.js';
import {
  LeadOpportunity,
  type LEAD_SHAREABLE_FIELDS,
} from '../models/LeadOpportunity.js';
import { LeadProposal } from '../models/LeadProposal.js';
import { OrganizationMembership } from '../models/OrganizationMembership.js';
import { Supplier } from '../models/Supplier.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

type ConsentedField = (typeof LEAD_SHAREABLE_FIELDS)[number];

export interface CreateLeadInput {
  operatorId?: string;
  category: string;
  city: string;
  region: string;
  budgetMinCents?: number | null;
  budgetMaxCents?: number | null;
  currency: string;
  requirements: string;
  urgency: 'low' | 'normal' | 'high';
  consentedFields: ConsentedField[];
}

function assertId(value: string, label: string): void {
  if (!isValidObjectId(value)) throw new HttpError(400, `Invalid ${label}`);
}

function publicLead(lead: Record<string, unknown>) {
  return {
    id: String(lead._id),
    category: lead.category,
    city: lead.city,
    region: lead.region,
    budgetMinCents: lead.budgetMinCents ?? null,
    budgetMaxCents: lead.budgetMaxCents ?? null,
    currency: lead.currency,
    requirements: lead.requirements,
    urgency: lead.urgency,
    consentedFields: lead.consentedFields,
    status: lead.status,
    expiresAt: (lead.expiresAt as Date).toISOString(),
    createdAt: (lead.createdAt as Date).toISOString(),
  };
}

export async function createLead(userId: string, input: CreateLeadInput) {
  const requiredConsent = [
    'category',
    'city',
    'region',
    'currency',
    'requirements',
    'urgency',
    ...(input.budgetMinCents != null ? ['budgetMinCents'] : []),
    ...(input.budgetMaxCents != null ? ['budgetMaxCents'] : []),
  ] as ConsentedField[];
  const missingConsent = requiredConsent.filter(
    (field) => !input.consentedFields.includes(field),
  );
  if (missingConsent.length) {
    throw new HttpError(
      400,
      `Consent must explicitly include shared fields: ${missingConsent.join(', ')}`,
    );
  }
  const recentDuplicate = await LeadOpportunity.exists({
    requesterUserId: userId,
    category: input.category,
    city: input.city,
    requirements: input.requirements,
    status: { $in: ['open', 'matched'] },
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });
  if (recentDuplicate) {
    throw new HttpError(409, 'A matching active quote request was created recently');
  }
  if (
    input.budgetMinCents !== null &&
    input.budgetMinCents !== undefined &&
    input.budgetMaxCents !== null &&
    input.budgetMaxCents !== undefined &&
    input.budgetMinCents > input.budgetMaxCents
  ) {
    throw new HttpError(400, 'Minimum budget cannot exceed maximum budget');
  }
  if (input.operatorId) {
    assertId(input.operatorId, 'operator id');
    const membership = await OrganizationMembership.exists({
      userId,
      operatorId: input.operatorId,
      status: 'active',
    });
    if (!membership) throw new HttpError(403, 'Operator scope is not available to this user');
  }
  const consentedAt = new Date();
  const lead = await LeadOpportunity.create({
    requesterUserId: userId,
    operatorId: input.operatorId ?? null,
    ...input,
    status: 'open',
    consentedAt,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await ConsentRecord.create({
    principalKey: `user:${userId}`,
    purpose: 'lead_share',
    status: 'granted',
    scope: {
      context: `lead:${lead._id}`,
      leadId: String(lead._id),
      fields: input.consentedFields,
      recipients: 'approved_matching_suppliers',
    },
    grantedAt: consentedAt,
  });
  return publicLead(lead.toObject() as unknown as Record<string, unknown>);
}

export async function listMyLeads(userId: string) {
  const leads = await LeadOpportunity.find({ requesterUserId: userId })
    .sort({ createdAt: -1 })
    .lean();
  const proposals = await LeadProposal.find({ leadId: { $in: leads.map((lead) => lead._id) } })
    .populate('supplierId', 'companyName slug contactEmail websiteUrl')
    .sort({ submittedAt: -1 })
    .lean();
  const proposalsByLead = new Map<string, unknown[]>();
  for (const proposal of proposals) {
    const supplier = proposal.supplierId as unknown as {
      _id: unknown;
      companyName: string;
      slug: string;
      contactEmail?: string;
      websiteUrl?: string;
    };
    const accepted = proposal.status === 'accepted';
    const item = {
      id: String(proposal._id),
      leadId: String(proposal.leadId),
      supplier: {
        id: String(supplier._id),
        companyName: supplier.companyName,
        slug: supplier.slug,
        ...(accepted
          ? {
              contactEmail: supplier.contactEmail ?? null,
              websiteUrl: supplier.websiteUrl ?? null,
            }
          : {}),
      },
      message: proposal.message,
      priceEstimateMinCents: proposal.priceEstimateMinCents ?? null,
      priceEstimateMaxCents: proposal.priceEstimateMaxCents ?? null,
      currency: proposal.currency,
      status: proposal.status,
      submittedAt: proposal.submittedAt.toISOString(),
    };
    const key = String(proposal.leadId);
    proposalsByLead.set(key, [...(proposalsByLead.get(key) ?? []), item]);
  }
  return leads.map((lead) => ({
    ...publicLead(lead as unknown as Record<string, unknown>),
    proposals: proposalsByLead.get(String(lead._id)) ?? [],
  }));
}

export async function listMyLeadProposals(userId: string, leadId: string) {
  assertId(leadId, 'lead id');
  const leads = await listMyLeads(userId);
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new HttpError(404, 'Lead not found');
  return lead.proposals;
}

export async function cancelLead(userId: string, leadId: string) {
  assertId(leadId, 'lead id');
  const lead = await LeadOpportunity.findOneAndUpdate(
    {
      _id: leadId,
      requesterUserId: userId,
      status: { $in: ['draft', 'open', 'matched'] },
    },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true },
  );
  if (!lead) throw new HttpError(409, 'Only an active lead can be cancelled');
  await ConsentRecord.updateOne(
    { principalKey: `user:${userId}`, purpose: 'lead_share', 'scope.context': `lead:${leadId}` },
    { $set: { status: 'withdrawn', withdrawnAt: new Date() } },
  );
  return publicLead(lead.toObject() as unknown as Record<string, unknown>);
}

async function supplierForOwner(userId: string) {
  const supplier = await Supplier.findOne({
    ownerUserId: userId,
    approved: true,
    status: 'active',
  });
  if (!supplier) throw new HttpError(403, 'An approved active supplier profile is required');
  return supplier;
}

export async function listSupplierLeads(userId: string) {
  const supplier = await supplierForOwner(userId);
  const leads = await LeadOpportunity.find({
    status: 'open',
    expiresAt: { $gt: new Date() },
    category: { $in: supplier.categories },
    region: { $in: supplier.serviceRegions },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return leads.map((lead) => ({
    id: String(lead._id),
    anonymousRef: `Opportunity ${String(lead._id).slice(-6).toUpperCase()}`,
    category: lead.category,
    city: lead.city,
    region: lead.region,
    budgetMinCents: lead.budgetMinCents ?? null,
    budgetMaxCents: lead.budgetMaxCents ?? null,
    currency: lead.currency,
    requirements: lead.requirements,
    urgency: lead.urgency,
    expiresAt: lead.expiresAt.toISOString(),
    createdAt: lead.createdAt.toISOString(),
  }));
}

export async function submitProposal(
  userId: string,
  leadId: string,
  input: {
    message: string;
    priceEstimateMinCents?: number | null;
    priceEstimateMaxCents?: number | null;
    currency: string;
  },
) {
  assertId(leadId, 'lead id');
  const supplier = await supplierForOwner(userId);
  const eligible = await LeadOpportunity.exists({
    _id: leadId,
    status: 'open',
    expiresAt: { $gt: new Date() },
    category: { $in: supplier.categories },
    region: { $in: supplier.serviceRegions },
  });
  if (!eligible) throw new HttpError(404, 'Matching open lead not found');
  try {
    const proposal = await LeadProposal.create({
      leadId,
      supplierId: supplier._id,
      ...input,
      status: 'submitted',
      submittedAt: new Date(),
    });
    return { id: String(proposal._id), status: proposal.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'This supplier already proposed on the lead');
    }
    throw error;
  }
}

export async function listSupplierProposals(userId: string) {
  const supplier = await supplierForOwner(userId);
  const proposals = await LeadProposal.find({ supplierId: supplier._id })
    .populate('leadId')
    .sort({ submittedAt: -1 })
    .lean();
  const requesterIds = proposals
    .filter((proposal) => proposal.status === 'accepted')
    .map((proposal) => {
      const lead = proposal.leadId as unknown as { requesterUserId: unknown };
      return lead.requesterUserId;
    });
  const users = await User.find({ _id: { $in: requesterIds } }).select({ email: 1 }).lean();
  const emails = new Map(users.map((user) => [String(user._id), user.email]));
  return proposals.map((proposal) => {
    const lead = proposal.leadId as unknown as Record<string, unknown> & {
      requesterUserId: unknown;
      consentedFields: string[];
    };
    const accepted = proposal.status === 'accepted' && lead.status === 'matched';
    return {
      id: String(proposal._id),
      status: proposal.status,
      message: proposal.message,
      priceEstimateMinCents: proposal.priceEstimateMinCents ?? null,
      priceEstimateMaxCents: proposal.priceEstimateMaxCents ?? null,
      currency: proposal.currency,
      submittedAt: proposal.submittedAt.toISOString(),
      lead: {
        ...publicLead(lead),
        anonymousRef: `Opportunity ${String(lead._id).slice(-6).toUpperCase()}`,
      },
      requesterDetails:
        accepted && lead.consentedFields.includes('requesterEmail')
          ? { email: emails.get(String(lead.requesterUserId)) ?? null }
          : null,
    };
  });
}

export async function acceptProposal(userId: string, leadId: string, proposalId: string) {
  assertId(leadId, 'lead id');
  assertId(proposalId, 'proposal id');
  const proposal = await LeadProposal.findOne({
    _id: proposalId,
    leadId,
    status: 'submitted',
  });
  if (!proposal) throw new HttpError(404, 'Proposal not found');
  const acceptedAt = new Date();
  const lead = await LeadOpportunity.findOneAndUpdate(
    {
      _id: leadId,
      requesterUserId: userId,
      status: 'open',
      acceptedProposalId: null,
      expiresAt: { $gt: acceptedAt },
    },
    {
      $set: {
        status: 'matched',
        acceptedProposalId: proposal._id,
        acceptedSupplierId: proposal.supplierId,
        identityReleasedAt: acceptedAt,
      },
    },
    { new: true },
  );
  if (!lead) throw new HttpError(409, 'Lead is no longer available for proposal acceptance');
  proposal.status = 'accepted';
  proposal.acceptedAt = acceptedAt;
  await proposal.save();
  await LeadProposal.updateMany(
    { leadId, _id: { $ne: proposal._id }, status: 'submitted' },
    { $set: { status: 'declined', declinedAt: acceptedAt } },
  );
  await ConsentRecord.updateOne(
    { principalKey: `user:${userId}`, purpose: 'lead_share', 'scope.context': `lead:${leadId}` },
    { $set: { 'scope.acceptedSupplierId': String(proposal.supplierId) } },
  );
  return { leadId, proposalId, status: 'accepted' as const };
}
