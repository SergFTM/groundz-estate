// src/routes/api/otc/listings/[id]/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { cancelListing, buildAssetSummary, LISTING_ASSET_INCLUDE } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const listing = await db.otcListing.findUnique({
    where: { id: params.id },
    include: {
      ...LISTING_ASSET_INCLUDE,
      offers: {
        orderBy: { amount: 'desc' },
        select: { id: true, amount: true, message: true, status: true, buyerId: true, createdAt: true },
      },
    },
  });

  if (!listing) return json({ error: 'Not found' }, { status: 404 });

  return json({
    ...listing,
    assetSummary: buildAssetSummary(listing),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await cancelListing(params.id, locals.user.id, locals.user.role);
    return json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    const status = msg === 'Listing not found' ? 404 : msg === 'Forbidden' ? 403 : 400;
    return json({ error: msg }, { status });
  }
};
