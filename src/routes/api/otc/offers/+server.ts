// src/routes/api/otc/offers/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.listingId || !body?.amount) {
    return json({ error: 'listingId and amount required' }, { status: 400 });
  }

  const listing = await db.otcListing.findUnique({ where: { id: body.listingId } });
  if (!listing || listing.status !== 'active') {
    return json({ error: 'Listing not found or not active' }, { status: 404 });
  }
  if (listing.sellerId === locals.user.id) {
    return json({ error: 'Seller cannot submit an offer on their own listing' }, { status: 400 });
  }

  // One-pending-offer guard
  const existing = await db.otcOffer.findFirst({
    where: { listingId: body.listingId, buyerId: locals.user.id, status: 'pending' },
  });
  if (existing) {
    return json({ error: 'You already have a pending offer on this listing' }, { status: 400 });
  }

  const offer = await db.otcOffer.create({
    data: {
      listingId: body.listingId,
      buyerId: locals.user.id,
      amount: Number(body.amount),
      message: body.message ?? null,
    },
  });

  return json(offer, { status: 201 });
};
