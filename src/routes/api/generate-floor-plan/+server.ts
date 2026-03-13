import { json, error } from '@sveltejs/kit';
import { getSetting } from '$lib/server/settings';
import { generateFloorPlanImage } from '$lib/server/gemini-tour';
import db from '$lib/server/db';
import * as path from 'path';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { unitId, imageQuality } = await request.json();
  if (!unitId) throw error(400, 'unitId required');

  const [apiKey, imageModel, savedQuality] = await Promise.all([
    getSetting('openai_api_key'),
    getSetting('openai_image_model'),
    getSetting('openai_image_quality'),
  ]);
  if (!apiKey) throw error(503, 'OpenAI API key not configured');

  const quality = imageQuality ?? savedQuality ?? 'high';

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { id: true, code: true, type: true },
  });
  if (!unit) throw error(404, 'Unit not found');

  const staticDir = path.resolve('static');

  let url: string;
  try {
    url = await generateFloorPlanImage(apiKey, unit, staticDir, imageModel ?? 'gpt-image-1', quality);
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
