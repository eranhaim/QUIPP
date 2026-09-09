import { isValidObjectId } from 'mongoose';
import { AffiliateClick } from '../models/AffiliateClick.js';
import { AffiliateOffer } from '../models/AffiliateOffer.js';
import { Product } from '../models/Product.js';
import { Supplier } from '../models/Supplier.js';
import { HttpError } from '../middleware/errorHandler.js';

export interface ProductSearchInput {
  slug?: string;
  q?: string;
  category?: string;
  region?: string;
  budgetCents?: number;
  limit?: number;
}

export interface MarketplaceProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  specifications: Record<string, string>;
  regions: string[];
  priceMinCents: number | null;
  priceMaxCents: number | null;
  currency: string;
  sourceUrl: string;
  sourceUpdatedAt: string;
  dataNotice: string;
  supplier: { id: string; companyName: string; slug: string };
  offer: null | {
    id: string;
    disclosureLabel: string;
    trackedUrl: string;
  };
  fitScore: number;
}

type LeanSupplier = {
  _id: unknown;
  companyName: string;
  slug: string;
};

type LeanProduct = {
  _id: unknown;
  supplierId: unknown;
  slug: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  specifications?: Map<string, string> | Record<string, string>;
  regions: string[];
  priceMinCents?: number | null;
  priceMaxCents?: number | null;
  currency: string;
  sourceUrl: string;
  sourceUpdatedAt: Date;
};

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function productFit(product: LeanProduct, input: ProductSearchInput): number {
  let score = 0;
  if (input.category && normalized(product.category) === normalized(input.category)) score += 30;
  if (input.region && product.regions.some((value) => normalized(value) === normalized(input.region!))) {
    score += 25;
  }
  if (input.budgetCents !== undefined) {
    const min = product.priceMinCents ?? 0;
    const max = product.priceMaxCents;
    if (min <= input.budgetCents) score += 20;
    if (max !== null && max !== undefined && max <= input.budgetCents) score += 5;
  }
  const terms = normalized(input.q ?? '').split(/\s+/).filter(Boolean);
  if (terms.length) {
    const haystack = normalized(
      `${product.name} ${product.brand} ${product.model} ${product.category} ${product.description}`,
    );
    score += terms.reduce((total, term) => total + (haystack.includes(term) ? 10 : 0), 0);
  }
  return score;
}

function specs(value: LeanProduct['specifications']): Record<string, string> {
  if (value instanceof Map) return Object.fromEntries(value);
  return value ?? {};
}

export async function searchProducts(input: ProductSearchInput): Promise<MarketplaceProduct[]> {
  const suppliers = await Supplier.find({ approved: true, status: 'active' })
    .select({ companyName: 1, slug: 1 })
    .lean();
  const supplierMap = new Map(
    suppliers.map((supplier) => [String(supplier._id), supplier as unknown as LeanSupplier]),
  );
  if (!supplierMap.size) return [];

  const products = (await Product.find({
    active: true,
    supplierId: { $in: [...supplierMap.keys()] },
    ...(input.slug ? { slug: input.slug.toLowerCase() } : {}),
    ...(input.category ? { category: new RegExp(`^${escapeRegex(input.category)}$`, 'i') } : {}),
    ...(input.region ? { regions: new RegExp(`^${escapeRegex(input.region)}$`, 'i') } : {}),
    ...(input.budgetCents !== undefined
      ? { $or: [{ priceMinCents: null }, { priceMinCents: { $lte: input.budgetCents } }] }
      : {}),
  }).lean()) as unknown as LeanProduct[];

  const ordered = products
    .map((product) => ({ product, score: productFit(product, input) }))
    .filter(({ score }) => !input.q || score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.product.name.localeCompare(b.product.name) ||
        String(a.product._id).localeCompare(String(b.product._id)),
    )
    .slice(0, Math.min(Math.max(input.limit ?? 20, 1), 50));

  const offers = await AffiliateOffer.find({
    active: true,
    productId: { $in: ordered.map(({ product }) => product._id) },
  })
    .sort({ productId: 1, priority: -1, createdAt: 1 })
    .select({ productId: 1, disclosureLabel: 1 })
    .lean();
  const offerByProduct = new Map<string, (typeof offers)[number]>();
  for (const offer of offers) {
    const key = String(offer.productId);
    if (!offerByProduct.has(key)) offerByProduct.set(key, offer);
  }

  return ordered.map(({ product, score }) => {
    const supplier = supplierMap.get(String(product.supplierId))!;
    const offer = offerByProduct.get(String(product._id));
    return {
      id: String(product._id),
      slug: product.slug,
      name: product.name,
      category: product.category,
      brand: product.brand,
      model: product.model,
      description: product.description,
      specifications: specs(product.specifications),
      regions: product.regions,
      priceMinCents: product.priceMinCents ?? null,
      priceMaxCents: product.priceMaxCents ?? null,
      currency: product.currency,
      sourceUrl: product.sourceUrl,
      sourceUpdatedAt: product.sourceUpdatedAt.toISOString(),
      dataNotice: 'Demo catalog data is unverified. Confirm price, compatibility, stock, and coverage with the supplier.',
      supplier: {
        id: String(supplier._id),
        companyName: supplier.companyName,
        slug: supplier.slug,
      },
      offer: offer
        ? {
            id: String(offer._id),
            disclosureLabel: offer.disclosureLabel,
            trackedUrl: `/api/marketplace/offers/${offer._id}/click`,
          }
        : null,
      fitScore: score,
    };
  });
}

export async function getProduct(slug: string): Promise<MarketplaceProduct> {
  const products = await searchProducts({ slug, limit: 1 });
  const product = products[0];
  if (!product) throw new HttpError(404, 'Product not found');
  return product;
}

export async function recordAffiliateClick(input: {
  offerId: string;
  userId?: string;
  principalKey: string;
  channel: 'web' | 'greenapi';
}): Promise<string> {
  if (!isValidObjectId(input.offerId)) throw new HttpError(404, 'Offer not found');
  const offer = await AffiliateOffer.findOne({ _id: input.offerId, active: true })
    .select('+destinationUrl productId supplierId')
    .lean();
  if (!offer) throw new HttpError(404, 'Offer not found');
  const product = await Product.exists({ _id: offer.productId, active: true });
  const supplier = await Supplier.exists({
    _id: offer.supplierId,
    approved: true,
    status: 'active',
  });
  if (!product || !supplier) throw new HttpError(404, 'Offer not found');
  let destination: URL;
  try {
    destination = new URL(offer.destinationUrl);
  } catch {
    throw new HttpError(500, 'Stored offer destination is invalid');
  }
  if (!['http:', 'https:'].includes(destination.protocol)) {
    throw new HttpError(500, 'Stored offer destination is not allowed');
  }
  await AffiliateClick.create({
    offerId: offer._id,
    productId: offer.productId,
    userId: input.userId ?? null,
    principalKey: input.principalKey,
    channel: input.channel,
    clickedAt: new Date(),
  });
  return destination.toString();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
