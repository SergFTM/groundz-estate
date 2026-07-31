import { json, error } from '@sveltejs/kit';
import { getSetting } from '$lib/server/settings';
import { generateTourImages } from '$lib/server/gemini-tour';
import { aiGuard } from '$lib/server/ai-guard';
import db from '$lib/server/db';
import * as path from 'path';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'image_ai' });
  const { unitId, fillOnly = false, imageQuality } = await event.request.json();
  if (!unitId) throw error(400, 'unitId required');

  const savedQuality = await getSetting('local_image_quality');
  const quality = imageQuality ?? savedQuality ?? 'high';

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { id: true, code: true, type: true, tourImages: true },
  });
  if (!unit) throw error(404, 'Unit not found');

  // When filling, pass existing images so the generator skips them
  const existingImages = fillOnly && unit.tourImages
    ? (() => { try { return JSON.parse(unit.tourImages); } catch { return []; } })()
    : [];

  const staticDir = path.resolve('static');

  let result;
  try {
    result = await generateTourImages('', unit, staticDir, 'sdxl', existingImages, quality);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-tour]', msg);
    return json({ success: false, message: msg }, { status: 500 });
  }

  await db.unit.update({
    where: { id: unitId },
    data: { tourImages: JSON.stringify(result.images) },
  });

  return json({ success: true, count: result.images.length, images: result.images });
};
