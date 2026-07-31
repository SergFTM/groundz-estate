import { json, error } from '@sveltejs/kit';
import { getSetting } from '$lib/server/settings';
import { LLM_TIERS } from '$lib/server/local-llm';
import { LOCAL_IMAGE_DEFAULTS } from '$lib/server/local-image';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (locals.user?.role !== 'internal_team') throw error(403, 'Forbidden');

  const imageQuality = await getSetting('local_image_quality');

  return json({
    smallModel:   LLM_TIERS.small,
    largeModel:   LLM_TIERS.large,
    imageModel:   LOCAL_IMAGE_DEFAULTS.model,
    imageQuality: imageQuality ?? 'high',
  });
};
