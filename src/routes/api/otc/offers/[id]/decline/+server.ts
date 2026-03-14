// src/routes/api/otc/offers/[id]/decline/+server.ts
import { json } from '@sveltejs/kit';
import { declineOffer } from '$lib/server/otc/service.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const offer = await declineOffer(params.id, locals.user.id);
    return json({ ok: true, offer });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    const status = msg === 'Offer not found' ? 404 : msg === 'Forbidden' ? 403 : 400;
    return json({ error: msg }, { status });
  }
};
