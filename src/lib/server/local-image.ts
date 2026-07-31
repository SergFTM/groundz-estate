// Local Stable Diffusion client — talks to Automatic1111 SD WebUI REST API.
// Start the WebUI with: ./webui.sh --api  (or --listen --api for remote)
import { env } from '$env/dynamic/private';

const IMAGE_URL = env.LOCAL_IMAGE_URL ?? 'http://localhost:7860';
const IMAGE_MODEL = env.LOCAL_IMAGE_MODEL ?? 'sdxl';
const STEPS = Number(env.LOCAL_IMAGE_STEPS ?? 28);
const CFG = Number(env.LOCAL_IMAGE_CFG ?? 7);

export const LOCAL_IMAGE_DEFAULTS = {
  url: IMAGE_URL,
  model: IMAGE_MODEL,
  steps: STEPS,
  cfg: CFG,
};

export class LocalImageError extends Error {
  constructor(message: string, public readonly code: 'unavailable' | 'api_error' | 'no_image') {
    super(message);
    this.name = 'LocalImageError';
  }
}

export interface LocalImageOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  seed?: number;
}

const DEFAULT_NEGATIVE = [
  'low quality, blurry, distorted, deformed, bad anatomy, watermark, text, signature,',
  'people, persons, faces, lowres, jpeg artifacts, cropped, oversaturated, ugly',
].join(' ');

/**
 * Generates a single image and returns the base64 PNG.
 * Throws LocalImageError if the WebUI is unreachable or returns no image.
 */
export async function generateLocalImage(options: LocalImageOptions): Promise<string> {
  const body = {
    prompt: options.prompt,
    negative_prompt: options.negativePrompt ?? DEFAULT_NEGATIVE,
    steps: options.steps ?? STEPS,
    cfg_scale: options.cfgScale ?? CFG,
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    sampler_name: options.sampler ?? 'DPM++ 2M Karras',
    seed: options.seed ?? -1,
    n_iter: 1,
    batch_size: 1,
  };

  let response: Response;
  try {
    response = await fetch(`${IMAGE_URL}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new LocalImageError(`SD WebUI unreachable at ${IMAGE_URL}: ${msg}`, 'unavailable');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new LocalImageError(`SD WebUI HTTP ${response.status}: ${text.slice(0, 200)}`, 'api_error');
  }

  const data = (await response.json()) as { images?: string[] };
  const b64 = data.images?.[0];
  if (!b64) throw new LocalImageError('SD WebUI returned no image', 'no_image');

  return b64;
}

/** Health-check: returns true if the WebUI is reachable. */
export async function checkLocalImageHealth(): Promise<{ ok: boolean; model?: string; error?: string }> {
  try {
    const r = await fetch(`${IMAGE_URL}/sdapi/v1/sd-models`, { method: 'GET' });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const models = (await r.json()) as Array<{ model_name?: string }>;
    return { ok: true, model: models[0]?.model_name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
