// GET/POST /api/settings/auto-mod — read/write comment auto-moderation setting
import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const setting = await db.appSetting.findUnique({ where: { key: 'comment_auto_mod' } });
  return json({ enabled: setting?.value === 'true' });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  await db.appSetting.upsert({
    where: { key: 'comment_auto_mod' },
    create: { key: 'comment_auto_mod', value: String(body?.enabled ?? false) },
    update: { value: String(body?.enabled ?? false) },
  });
  return json({ ok: true });
};
