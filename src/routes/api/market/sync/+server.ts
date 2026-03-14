// src/routes/api/market/sync/+server.ts
import { json } from '@sveltejs/kit';
import { syncEtf, syncCustom, dailyUpdate } from '$lib/server/market/sync.js';
import db from '$lib/server/db.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.indexId || !body?.mode) {
    return json({ error: 'indexId and mode required' }, { status: 400 });
  }

  const { indexId, mode } = body as { indexId: string; mode: 'initial' | 'daily' };

  const index = await db.marketIndex.findUnique({ where: { id: indexId } });
  if (!index) return json({ error: 'Index not found' }, { status: 404 });

  try {
    if (mode === 'initial') {
      if (index.type === 'custom') {
        await syncCustom(indexId);
      } else {
        await syncEtf(indexId);
      }
    } else {
      await dailyUpdate(indexId);
    }
    return json({ ok: true, syncedAt: new Date() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, { status: 500 });
  }
};
