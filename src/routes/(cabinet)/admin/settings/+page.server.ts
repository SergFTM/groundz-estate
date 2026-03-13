import { getSetting, setSetting } from '$lib/server/settings';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const DEFAULT_TEXT_MODEL    = 'gpt-4o';
const DEFAULT_IMAGE_MODEL   = 'dall-e-3';
const DEFAULT_IMAGE_QUALITY = 'high';

export const load: PageServerLoad = async () => {
  const [openaiKey, textModel, imageModel, imageQuality] = await Promise.all([
    getSetting('openai_api_key'),
    getSetting('openai_text_model'),
    getSetting('openai_image_model'),
    getSetting('openai_image_quality'),
  ]);
  return {
    openaiKeySet:     !!openaiKey,
    openaiKeyPreview: openaiKey ? `${openaiKey.slice(0, 7)}...${openaiKey.slice(-4)}` : null,
    textModel:    textModel    || DEFAULT_TEXT_MODEL,
    imageModel:   imageModel   || DEFAULT_IMAGE_MODEL,
    imageQuality: imageQuality || DEFAULT_IMAGE_QUALITY,
  };
};

export const actions: Actions = {
  saveOpenAI: async ({ request }) => {
    const data = await request.formData();
    const key = (data.get('key') as string)?.trim();
    if (!key || !key.startsWith('sk-')) {
      return fail(400, { error: 'Неверный формат ключа. Должен начинаться с sk-' });
    }
    await setSetting('openai_api_key', key);
    return { success: true };
  },

  clearOpenAI: async () => {
    await setSetting('openai_api_key', '');
    return { success: true, cleared: true };
  },

  saveModels: async ({ request }) => {
    const data = await request.formData();
    const textModel    = (data.get('textModel')    as string)?.trim();
    const imageModel   = (data.get('imageModel')   as string)?.trim();
    const imageQuality = (data.get('imageQuality') as string)?.trim();
    if (textModel)    await setSetting('openai_text_model',    textModel);
    if (imageModel)   await setSetting('openai_image_model',   imageModel);
    if (imageQuality) await setSetting('openai_image_quality', imageQuality);
    return { success: true, savedModels: true };
  },
};
