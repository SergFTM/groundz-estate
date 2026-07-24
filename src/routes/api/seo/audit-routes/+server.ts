// POST /api/seo/audit-routes
// Audits live marketing routes (lead-gen surfaces) by rendering them
// server-side and running the full SEO+AEO pipeline on the output.
import { json, error } from '@sveltejs/kit';
import { runSeoAudit } from '$lib/server/seo/orchestrator.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

// Default set = lead generator surfaces reachable without auth
const LEAD_GEN_ROUTES = ['/', '/lead-forms', '/lead-quiz', '/contact'];
const MAX_ROUTES = 10;

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'admin_job' });

  const body = await event.request.json().catch(() => ({}));
  const routes: string[] = Array.isArray(body?.routes) && body.routes.length
    ? body.routes.slice(0, MAX_ROUTES)
    : LEAD_GEN_ROUTES;

  if (routes.some(r => typeof r !== 'string' || !r.startsWith('/'))) {
    throw error(400, 'Routes must be same-origin paths starting with "/"');
  }

  const results = await Promise.all(routes.map(async (route) => {
    try {
      const res = await event.fetch(route);
      if (!res.ok) return { route, error: `HTTP ${res.status}` };
      const html = await res.text();
      const audit = await runSeoAudit({ route, html, locale: 'en', pageType: 'landing' });
      return {
        route,
        score: audit.score,
        aeoScore: audit.aeo.aeoScore,
        issueCount: audit.issues.length,
        aeoIssues: audit.aeo.issues,
        aiAvailable: audit.aiAvailable,
      };
    } catch (err) {
      return { route, error: err instanceof Error ? err.message : 'audit failed' };
    }
  }));

  return json({ audited: results.filter(r => !('error' in r)).length, results });
};
