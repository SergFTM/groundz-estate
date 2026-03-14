// src/routes/(marketing)/otc/+page.server.ts
import db from '$lib/server/db.js';
import { buildAssetSummary, LISTING_ASSET_INCLUDE } from '$lib/server/otc/service.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const type = url.searchParams.get('type') ?? '';
  const now = new Date();

  const listings = await db.otcListing.findMany({
    where: {
      status: 'active',
      ...(type ? { assetType: type } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: LISTING_ASSET_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return {
    listings: listings.map((l) => ({
      id: l.id,
      assetType: l.assetType,
      title: l.title,
      askPrice: l.askPrice,
      currency: l.currency,
      createdAt: l.createdAt.toISOString(),
      assetSummary: buildAssetSummary(l),
      offerCount: l._count.offers,
    })),
    activeType: type,
    isLoggedIn: !!locals.user,
  };
};
