// src/routes/api/otc/admin/listings/[id]/reject/+server.ts
import { json } from '@sveltejs/kit';
import { rejectListing } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.note) return json({ error: 'note required' }, { status: 400 });

  try {
    const listing = await rejectListing(params.id, body.note);
    return json({ ok: true, listing });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
};
