import { json } from '@sveltejs/kit';
import { getSetting } from '$lib/server/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const [textModel, imageModel, imageQuality] = await Promise.all([
    getSetting('openai_text_model'),
    getSetting('openai_image_model'),
    getSetting('openai_image_quality'),
  ]);

  return json({
    textModel:    textModel    ?? 'gpt-4o',
    imageModel:   imageModel   ?? 'dall-e-3',
    imageQuality: imageQuality ?? 'high',
  });
};
