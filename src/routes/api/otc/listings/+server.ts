// src/routes/api/otc/listings/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { createListing, buildAssetSummary, LISTING_ASSET_INCLUDE } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const assetType = url.searchParams.get('type') ?? '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = 20;
  const offset = (page - 1) * limit;
  const now = new Date();

  const where = {
    status: 'active' as const,
    ...(assetType ? { assetType } : {}),
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const [listings, total] = await Promise.all([
    db.otcListing.findMany({
      where,
      include: LISTING_ASSET_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.otcListing.count({ where }),
  ]);

  return json({
    listings: listings.map((l) => ({
      id: l.id,
      assetType: l.assetType,
      title: l.title,
      askPrice: l.askPrice,
      currency: l.currency,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
      assetSummary: buildAssetSummary(l),
      offerCount: l._count.offers,
    })),
    total,
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid JSON' }, { status: 400 });

  try {
    const listing = await createListing(locals.user.id, {
      assetType: body.assetType,
      investmentId: body.investmentId,
      unitId: body.unitId,
      title: body.title,
      description: body.description,
      askPrice: Number(body.askPrice),
      currency: body.currency,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    return json(listing, { status: 201 });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
};
