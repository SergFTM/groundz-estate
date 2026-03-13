import { json, error } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { unitId, images } = await request.json();
  if (!unitId || !Array.isArray(images)) throw error(400, 'unitId and images required');

  await db.unit.update({
    where: { id: unitId },
    data: { tourImages: JSON.stringify(images) },
  });

  return json({ success: true });
};
