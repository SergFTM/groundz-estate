// src/routes/(cabinet)/investor/otc/+page.server.ts
import db from '$lib/server/db.js';
import { requireRole } from '$lib/server/guards.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = requireRole(event, ['investor']);

  const [myListings, myOffers, myInvestments] = await Promise.all([
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
    // Funded investments NOT already having a pending/active listing
    db.holding.findMany({
      where: {
        userId: user.id,
        status: 'funded',
        otcListings: { none: { status: { in: ['pending', 'active'] } } },
      },
      include: { pool: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { myListings, myOffers, myInvestments };
};
