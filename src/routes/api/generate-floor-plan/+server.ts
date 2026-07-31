import { json, error } from '@sveltejs/kit';
import { getSetting } from '$lib/server/settings';
import { generateFloorPlanImage } from '$lib/server/gemini-tour';
import { aiGuard } from '$lib/server/ai-guard';
import db from '$lib/server/db';
import * as path from 'path';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'image_ai' });
  const { unitId, imageQuality } = await event.request.json();
  if (!unitId) throw error(400, 'unitId required');

  const savedQuality = await getSetting('local_image_quality');
  const quality = imageQuality ?? savedQuality ?? 'high';

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { id: true, code: true, type: true },
  });
  if (!unit) throw error(404, 'Unit not found');

  const staticDir = path.resolve('static');

  let url: string;
  try {
    url = await generateFloorPlanImage('', unit, staticDir, 'sdxl', quality);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-floor-plan]', msg);
    return json({ success: false, message: msg }, { status: 500 });
  }

  await db.unit.update({
    where: { id: unitId },
    data: { tourFloorPlan: url },
  });

  return json({ success: true, url });
};
