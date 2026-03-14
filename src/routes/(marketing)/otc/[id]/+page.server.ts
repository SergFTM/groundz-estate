// src/routes/(marketing)/otc/[id]/+page.server.ts
import db from '$lib/server/db.js';
import { buildAssetSummary } from '$lib/server/otc/service.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const listing = await db.otcListing.findUnique({
    where: { id: params.id },
    include: {
      investment: { include: { pool: { select: { name: true } } } },
      unit: { select: { code: true, floor: true, areaSqm: true, project: { select: { name: true } } } },
      offers: {
        orderBy: { amount: 'desc' },
        select: {
          id: true, amount: true, message: true, status: true,
          buyerId: true, createdAt: true,
        },
      },
    },
  });

  if (!listing || listing.status !== 'active') throw error(404, 'Listing not found');

  const userId = locals.user?.id ?? null;
  const isSeller = userId === listing.sellerId;

  // Buyer: only show their own offers; seller: show all
  const visibleOffers = isSeller
    ? listing.offers
    : listing.offers.filter((o) => o.buyerId === userId);

  return {
    listing: {
      id: listing.id,
      assetType: listing.assetType,
      title: listing.title,
      description: listing.description,
      askPrice: listing.askPrice,
      currency: listing.currency,
      status: listing.status,
      assetSummary: buildAssetSummary(listing),
      createdAt: listing.createdAt.toISOString(),
    },
    offers: visibleOffers.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    isSeller,
    isLoggedIn: !!locals.user,
  };
};
