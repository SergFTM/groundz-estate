// POST /api/seo/audit-page
import { json, error } from '@sveltejs/kit';
import { runSeoAudit } from '$lib/server/seo/orchestrator.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const { pageId, route, html, locale, pageType, clusterId } = body as Record<string, unknown>;

  if (typeof html !== 'string' || !html.trim()) {
    throw error(400, 'Missing or empty "html" field');
  }
  if (!locale || !['en', 'ru'].includes(locale as string)) {
    throw error(400, '"locale" must be "en" or "ru"');
  }
  if (!['landing', 'article', 'faq', 'project'].includes(pageType as string)) {
    throw error(400, '"pageType" must be landing | article | faq | project');
  }

  try {
    const result = await runSeoAudit({
      pageId: pageId as string | undefined,
      route: route as string | undefined,
      html: html as string,
      locale: locale as 'en' | 'ru',
      pageType: pageType as 'landing' | 'article' | 'faq' | 'project',
      clusterId: clusterId as string | undefined,
    });
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    if (message.includes('rate limit') || message.includes('429')) throw error(429, message);
    throw error(500, message);
  }
};
