// Health check for local AI stack — small + large LLM (Ollama) + image gen (SD WebUI).
// Admin-only.
import { json, error } from '@sveltejs/kit';
import { localChat, LocalAiError, LLM_TIERS } from '$lib/server/local-llm';
import { checkLocalImageHealth, LOCAL_IMAGE_DEFAULTS } from '$lib/server/local-image';
import type { RequestHandler } from './$types';

async function probe(tier: 'small' | 'large') {
  const probeResult: { ok: boolean; model: string; sample?: string; error?: string; latencyMs?: number } = {
    ok: false,
    model: LLM_TIERS[tier],
  };
  const t0 = Date.now();
  try {
    const result = await localChat({ tier, prompt: 'Reply with exactly: ok', maxTokens: 16, temperature: 0 });
    probeResult.ok = !!result.content;
    probeResult.sample = result.content.slice(0, 80);
    probeResult.latencyMs = Date.now() - t0;
  } catch (err) {
    probeResult.error = err instanceof LocalAiError ? `${err.code}: ${err.message}` : String(err);
    probeResult.latencyMs = Date.now() - t0;
  }
  return probeResult;
}

export const GET: RequestHandler = async ({ locals }) => {
  if (locals.user?.role !== 'internal_team') throw error(403, 'Forbidden');

  const [small, large, image] = await Promise.all([
    probe('small'),
    probe('large'),
    checkLocalImageHealth(),
  ]);

  return json({
    llm: { small, large },
    image: { ok: image.ok, model: image.model, error: image.error, url: LOCAL_IMAGE_DEFAULTS.url },
  });
};
