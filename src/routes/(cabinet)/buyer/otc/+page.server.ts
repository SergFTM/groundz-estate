// src/routes/(cabinet)/buyer/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = requireRole(event, ['buyer']);

  const [myListings, myOffers, myUnits] = await Promise.all([
    db.otcListing.findMany({
      where: { sellerId: user.id },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.otcOffer.findMany({
      where: { buyerId: user.id },
      include: {
        listing: { select: { id: true, title: true, askPrice: true, currency: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Units owned by this buyer NOT already having a pending/active listing
    db.unit.findMany({
      where: {
        buyerId: user.id,
        otcListings: { none: { status: { in: ['pending', 'active'] } } },
      },
      select: { id: true, code: true, floor: true, areaSqm: true, type: true, project: { select: { name: true } } },
      orderBy: { code: 'asc' },
    }),
  ]);

  return { myListings, myOffers, myUnits };
};
