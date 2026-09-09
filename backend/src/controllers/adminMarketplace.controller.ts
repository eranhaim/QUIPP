import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { AffiliateOffer, COMMISSION_TYPES } from '../models/AffiliateOffer.js';
import { LeadOpportunity, LEAD_STATUSES } from '../models/LeadOpportunity.js';
import { Product } from '../models/Product.js';
import { Supplier, SUPPLIER_STATUSES } from '../models/Supplier.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');
const slug = z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const httpUrl = z.string().url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol));

const supplierFields = {
  ownerUserId: id.nullable().optional(),
  companyName: z.string().trim().min(2).max(200),
  slug,
  approved: z.boolean().optional(),
  serviceRegions: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  categories: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  websiteUrl: httpUrl.nullable().optional(),
  contactEmail: z.string().trim().email(),
  status: z.enum(SUPPLIER_STATUSES).optional(),
};
const supplierCreateSchema = z.object(supplierFields);
const supplierUpdateSchema = z.object(supplierFields).partial().omit({ slug: true });

const productFields = {
  supplierId: id,
  name: z.string().trim().min(2).max(200),
  slug,
  category: z.string().trim().min(2).max(100),
  brand: z.string().trim().min(1).max(150),
  model: z.string().trim().min(1).max(150),
  description: z.string().trim().min(5).max(10_000),
  specifications: z.record(z.string().max(500)).default({}),
  regions: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  priceMinCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  priceMaxCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  currency: z.string().trim().length(3).default('USD'),
  sourceUrl: httpUrl,
  sourceUpdatedAt: z.coerce.date(),
  active: z.boolean().optional(),
};
const productCreateSchema = z.object(productFields);
const productUpdateSchema = z.object(productFields).partial().omit({ slug: true });

const offerFields = {
  productId: id,
  supplierId: id,
  destinationUrl: httpUrl,
  disclosureLabel: z.string().trim().min(5).max(300),
  commissionType: z.enum(COMMISSION_TYPES).default('unknown'),
  commissionAmount: z.number().min(0).nullable().optional(),
  active: z.boolean().optional(),
  priority: z.number().int().min(-1000).max(1000).optional(),
};
const offerCreateSchema = z.object(offerFields);
const offerUpdateSchema = z.object(offerFields).partial();

async function applyOwnerRole(ownerUserId?: string | null): Promise<void> {
  if (!ownerUserId) return;
  const user = await User.findById(ownerUserId);
  if (!user) throw new HttpError(404, 'Supplier owner user not found');
  if (!user.roles.includes('supplier')) {
    user.roles.push('supplier');
    await user.save();
  }
}

export async function overview(req: Request, res: Response) {
  const leadStatus = z.enum(LEAD_STATUSES).optional().parse(req.query.status);
  const [suppliers, products, offers, leads] = await Promise.all([
    Supplier.find({}).sort({ companyName: 1 }).lean(),
    Product.find({}).sort({ name: 1 }).lean(),
    AffiliateOffer.find({}).select('+commissionAmount').sort({ createdAt: -1 }).lean(),
    LeadOpportunity.find(leadStatus ? { status: leadStatus } : {})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  ]);
  res.json({
    suppliers,
    products,
    offers,
    leads: leads.map((lead) => ({
      id: String(lead._id),
      requesterUserId: String(lead.requesterUserId),
      operatorId: lead.operatorId ? String(lead.operatorId) : null,
      category: lead.category,
      city: lead.city,
      region: lead.region,
      budgetMinCents: lead.budgetMinCents ?? null,
      budgetMaxCents: lead.budgetMaxCents ?? null,
      currency: lead.currency,
      urgency: lead.urgency,
      status: lead.status,
      consentedFields: lead.consentedFields,
      expiresAt: lead.expiresAt,
      createdAt: lead.createdAt,
    })),
  });
}

export async function createSupplier(req: Request, res: Response) {
  const input = supplierCreateSchema.parse(req.body);
  await applyOwnerRole(input.ownerUserId);
  const supplier = await Supplier.create(input);
  res.status(201).json({ supplier });
}

export async function updateSupplier(req: Request, res: Response) {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid supplier id');
  const input = supplierUpdateSchema.parse(req.body);
  await applyOwnerRole(input.ownerUserId);
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, input, {
    new: true,
    runValidators: true,
  });
  if (!supplier) throw new HttpError(404, 'Supplier not found');
  res.json({ supplier });
}

export async function createProduct(req: Request, res: Response) {
  const input = productCreateSchema.parse(req.body);
  if (!(await Supplier.exists({ _id: input.supplierId }))) {
    throw new HttpError(404, 'Supplier not found');
  }
  if (
    input.priceMinCents != null &&
    input.priceMaxCents != null &&
    input.priceMinCents > input.priceMaxCents
  ) {
    throw new HttpError(400, 'Minimum price cannot exceed maximum price');
  }
  const product = await Product.create(input);
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response) {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid product id');
  const input = productUpdateSchema.parse(req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, input, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ product });
}

async function validateOfferScope(productId: string, supplierId: string): Promise<void> {
  const product = await Product.findById(productId).select({ supplierId: 1 }).lean();
  if (!product) throw new HttpError(404, 'Product not found');
  if (String(product.supplierId) !== supplierId) {
    throw new HttpError(400, 'Offer supplier must own the product');
  }
}

export async function createOffer(req: Request, res: Response) {
  const input = offerCreateSchema.parse(req.body);
  await validateOfferScope(input.productId, input.supplierId);
  const offer = await AffiliateOffer.create(input);
  res.status(201).json({ offer });
}

export async function updateOffer(req: Request, res: Response) {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid offer id');
  const input = offerUpdateSchema.parse(req.body);
  const current = await AffiliateOffer.findById(req.params.id).select('+commissionAmount');
  if (!current) throw new HttpError(404, 'Offer not found');
  await validateOfferScope(
    input.productId ?? String(current.productId),
    input.supplierId ?? String(current.supplierId),
  );
  Object.assign(current, input);
  await current.save();
  res.json({ offer: current });
}
