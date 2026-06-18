import { json, error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { aiGuard } from '$lib/server/ai-guard';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'admin_job' });
  const { unitId, images } = await event.request.json();
  if (!unitId || !Array.isArray(images)) throw error(400, 'unitId and images required');

  await db.unit.update({
    where: { id: unitId },
    data: { tourImages: JSON.stringify(images) },
  });

  return json({ success: true });
};
