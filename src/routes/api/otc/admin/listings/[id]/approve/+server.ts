// src/routes/api/otc/admin/listings/[id]/approve/+server.ts
import { json } from '@sveltejs/kit';
import { approveListing } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const listing = await approveListing(params.id);
    return json({ ok: true, listing });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
};
