// src/lib/server/otc/service.ts
import db from '$lib/server/db.js';

const VALID_ASSET_TYPES = ['investment_share', 'option_contract', 'apartment'] as const;
type AssetType = (typeof VALID_ASSET_TYPES)[number];

// ─── Asset summary helper ────────────────────────────────────────────────────

type ListingWithAsset = {
  assetType: string;
  investment: { amount: number; pool: { name: string } } | null;
  unit: { code: string; floor: number; areaSqm: number } | null;
};

export function buildAssetSummary(l: ListingWithAsset): string {
  if (l.assetType === 'investment_share' && l.investment) {
    return `${l.investment.pool.name} — €${l.investment.amount.toLocaleString('en')} committed`;
  }
  if (l.unit) {
    return `Unit ${l.unit.code}, Floor ${l.unit.floor}, ${l.unit.areaSqm}m²`;
  }
  return '—';
}

// ─── Include shapes ──────────────────────────────────────────────────────────

export const LISTING_ASSET_INCLUDE = {
  investment: { include: { pool: { select: { name: true } } } },
  unit: { select: { code: true, floor: true, areaSqm: true, project: { select: { name: true } } } },
  _count: { select: { offers: true } },
} as const;

export const ADMIN_LISTING_INCLUDE = {
  seller: { select: { name: true, email: true } },
  investment: { include: { pool: { select: { name: true } } } },
  unit: { select: { code: true, floor: true, areaSqm: true } },
  _count: { select: { offers: true } },
} as const;

// ─── createListing ───────────────────────────────────────────────────────────

export interface CreateListingInput {
  assetType: string;
  investmentId?: string;
  unitId?: string;
  title: string;
  description?: string;
  askPrice: number;
  currency?: string;
  expiresAt?: Date;
}

export async function createListing(sellerId: string, input: CreateListingInput) {
  if (!VALID_ASSET_TYPES.includes(input.assetType as AssetType)) {
    throw new Error('Invalid assetType');
  }

  if (input.assetType === 'investment_share') {
    if (!input.investmentId) throw new Error('investmentId required for investment_share');
    const inv = await db.investorInvestment.findUnique({ where: { id: input.investmentId } });
    if (!inv || inv.userId !== sellerId) throw new Error('Investment not found or not owned by seller');
    const existing = await db.otcListing.findFirst({
      where: { investmentId: input.investmentId, status: { in: ['pending', 'active'] } },
    });
    if (existing) throw new Error('A listing already exists for this investment');
  } else {
    if (!input.unitId) throw new Error('unitId required for option_contract/apartment');
    const unit = await db.unit.findUnique({ where: { id: input.unitId } });
    if (!unit || unit.buyerId !== sellerId) throw new Error('Unit not found or not owned by seller');
    const existing = await db.otcListing.findFirst({
      where: { unitId: input.unitId, status: { in: ['pending', 'active'] } },
    });
    if (existing) throw new Error('A listing already exists for this unit');
  }

  return db.otcListing.create({
    data: {
      sellerId,
      assetType: input.assetType,
      investmentId: input.investmentId ?? null,
      unitId: input.unitId ?? null,
      title: input.title,
      description: input.description ?? null,
      askPrice: input.askPrice,
      currency: input.currency ?? 'EUR',
      expiresAt: input.expiresAt ?? null,
      status: 'pending',
    },
  });
}

// ─── acceptOffer ─────────────────────────────────────────────────────────────

export async function acceptOffer(offerId: string, sellerId: string) {
  return db.$transaction(async (tx) => {
    const offer = await tx.otcOffer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new Error('Offer not found');
    if (offer.listing.sellerId !== sellerId) throw new Error('Forbidden');
    if (offer.listing.status !== 'active') throw new Error('Listing is not active');
    if (offer.status !== 'pending') throw new Error('Offer is not pending');

    await tx.otcOffer.update({ where: { id: offerId }, data: { status: 'accepted' } });
    await tx.otcOffer.updateMany({
      where: { listingId: offer.listingId, id: { not: offerId }, status: 'pending' },
      data: { status: 'declined' },
    });
    await tx.otcListing.update({ where: { id: offer.listingId }, data: { status: 'sold' } });

    if (offer.listing.assetType === 'investment_share') {
      if (!offer.listing.investmentId)
        throw new Error('Asset no longer exists; cannot transfer ownership');
      await tx.investorInvestment.update({
        where: { id: offer.listing.investmentId },
        data: { userId: offer.buyerId },
      });
    } else {
      if (!offer.listing.unitId)
        throw new Error('Asset no longer exists; cannot transfer ownership');
      await tx.unit.update({
        where: { id: offer.listing.unitId },
        data: { buyerId: offer.buyerId },
      });
    }

    return tx.otcListing.findUnique({ where: { id: offer.listingId } });
  });
}

// ─── declineOffer ────────────────────────────────────────────────────────────

export async function declineOffer(offerId: string, sellerId: string) {
  const offer = await db.otcOffer.findUnique({
    where: { id: offerId },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!offer) throw new Error('Offer not found');
  if (offer.listing.sellerId !== sellerId) throw new Error('Forbidden');
  if (offer.status !== 'pending') throw new Error('Offer is not pending');
  return db.otcOffer.update({ where: { id: offerId }, data: { status: 'declined' } });
}

// ─── approveListing / rejectListing ──────────────────────────────────────────

export async function approveListing(listingId: string) {
  return db.otcListing.update({ where: { id: listingId }, data: { status: 'active' } });
}

export async function rejectListing(listingId: string, note: string) {
  return db.otcListing.update({
    where: { id: listingId },
    data: { status: 'rejected', adminNote: note },
  });
}

// ─── cancelListing ───────────────────────────────────────────────────────────

export async function cancelListing(listingId: string, actorId: string, actorRole: string) {
  const listing = await db.otcListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');
  if (!['pending', 'active'].includes(listing.status)) {
    throw new Error('Cannot cancel a listing in terminal status');
  }
  if (listing.sellerId !== actorId && actorRole !== 'internal_team') {
    throw new Error('Forbidden');
  }
  return db.otcListing.update({ where: { id: listingId }, data: { status: 'cancelled' } });
}
