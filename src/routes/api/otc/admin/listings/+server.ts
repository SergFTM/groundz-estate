// src/routes/api/otc/admin/listings/+server.ts
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { ADMIN_LISTING_INCLUDE } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = url.searchParams.get('status') ?? '';

  const listings = await db.otcListing.findMany({
    where: status ? { status } : {},
    include: ADMIN_LISTING_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return json({ listings });
};
