// POST /api/seo/suggest-links
// P2: full graph-based linker. Currently returns keyword-match stubs.
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/db.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['internal_team'], bucket: 'text_ai' });
  const body = await event.request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON');

  const { fromRoute, content, topN = 5 } = body;
  if (!fromRoute || !content) throw error(400, 'Missing required fields');

  // Find all profiles except current route
  const profiles = await prisma.seoPageProfile.findMany({
    where: { route: { not: fromRoute } },
    select: { id: true, route: true, metaTitle: true, targetKeywords: true },
    take: 50,
  });

  type Suggestion = { toRoute: string; anchorText: string; confidence: number; context: string };

  const suggestions: Suggestion[] = profiles
    .filter((p): p is typeof p & { route: string } => p.route !== null)
    .map(p => {
      const keywords: string[] = p.targetKeywords ? JSON.parse(p.targetKeywords) : [];
      const matched = keywords.find((kw: string) => (content as string).toLowerCase().includes(kw.toLowerCase()));
      const confidence = matched ? 0.7 : 0.3;
      const lc = (content as string).toLowerCase();
      const idx = matched ? lc.indexOf(matched.toLowerCase()) : -1;
      return {
        toRoute: p.route,
        anchorText: matched ?? p.metaTitle ?? p.route,
        confidence,
        context: matched && idx >= 0
          ? `...${(content as string).slice(Math.max(0, idx - 30), idx + matched.length + 30)}...`
          : '',
      };
    })
    .filter(s => s.confidence > 0.4)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN as number);

  return json({ suggestions });
};
