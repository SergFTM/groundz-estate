import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { getSetting } from '$lib/server/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const [apiKey, imageModel] = await Promise.all([
    getSetting('openai_api_key'),
    getSetting('openai_image_model'),
  ]);
  if (!apiKey) return json({ ok: false, error: 'OpenAI API key not set' });

  const model = imageModel ?? 'dall-e-3';
  const base  = model === 'dall-e-3-hd' ? 'dall-e-3' : model;

  try {
    const client = new OpenAI({ apiKey });

    let params: Parameters<OpenAI['images']['generate']>[0];
    if (base === 'gpt-image-1') {
      params = { model: base, prompt: 'A white wall, minimal test.', n: 1, size: '1024x1024', quality: 'low' };
    } else if (base === 'dall-e-2') {
      params = { model: base, prompt: 'A white wall, minimal test.', n: 1, size: '256x256', response_format: 'b64_json' };
    } else {
      params = { model: base, prompt: 'A white wall, minimal test.', n: 1, size: '1024x1024', response_format: 'b64_json', quality: 'standard' };
    }

    const resp = await client.images.generate(params);
    const got = 'data' in resp ? ((resp.data as unknown[])?.length ?? 0) : 0;
    return json({ ok: true, model: base, images: got });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ ok: false, model: base, error: msg });
  }
};
