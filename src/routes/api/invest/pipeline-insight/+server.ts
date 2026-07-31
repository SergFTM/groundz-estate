// POST /api/invest/pipeline-insight
// Returns: pipeline summary + per-investor next actions (cached 2h)
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import { AEO_CONTENT_GUIDELINES } from '$lib/server/seo/aeo-guidelines.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: ['agent', 'internal_team'], bucket: 'text_ai' });
  const { request } = event;
  const body = await request.json().catch(() => null);
  if (!body?.rows) return json({ error: 'rows required' }, { status: 400 });

  const { rows } = body as {
    rows: Array<{
      id: string;
      name: string | null;
      email: string;
      kycStatus: string;
      totalCommitted: number;
      funded: number;
      poolCount: number;
      latestPool: string | null;
      createdAt: string;
    }>;
  };

  const cacheKey = `pipeline_insight:${rows.map(r => r.id + r.kycStatus).join(',')}`;

  const cached = await db.aiResponseCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return json(JSON.parse(cached.response), { headers: { 'x-cached': 'true' } });
  }

  const investorList = rows
    .map(r => {
      const daysSince = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000);
      return `- ${r.name ?? r.email} | KYC: ${r.kycStatus} | Committed: €${r.totalCommitted.toLocaleString()} | Funded: €${r.funded.toLocaleString()} | Pools: ${r.poolCount} | Registered: ${daysSince}d ago`;
    })
    .join('\n');

  const prompt = `You are a CRM assistant for Groundz, a Cyprus real estate investment platform.

Investor pipeline:
${investorList}

Total investors: ${rows.length}
Total committed: €${rows.reduce((s, r) => s + r.totalCommitted, 0).toLocaleString()}
KYC approved: ${rows.filter(r => r.kycStatus === 'approved').length}/${rows.length}

Return a JSON object (no markdown, no explanation):
{
  "summary": "<one concise sentence describing the pipeline health and the single most urgent issue>",
  "actions": {
    "<investor_id>": "<one specific next action for this investor, max 10 words>"
  }
}

Action examples: "Send KYC reminder email", "Schedule intro call", "Follow up on funding commitment", "Approve pending KYC documents".
Be direct and specific. Use the investor IDs exactly as given below:
${rows.map(r => `${r.id} = ${r.name ?? r.email}`).join('\n')}`;

  try {
    const result = await callAI({
      systemPrompt: `You are a concise CRM assistant. Return only valid JSON, no markdown.${AEO_CONTENT_GUIDELINES}`,
      prompt,
      capability: 'invest.pipeline-insight',
    });

    let parsed: { summary: string; actions: Record<string, string> };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      // Strip markdown fences if model added them
      const cleaned = result.content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    await db.aiResponseCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        response: JSON.stringify(parsed),
        model: 'gpt-4o',
        tokensUsed: result.inputTokens + result.outputTokens,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      update: {
        response: JSON.stringify(parsed),
        tokensUsed: result.inputTokens + result.outputTokens,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    });

    return json(parsed);
  } catch {
    return json({ error: 'AI unavailable' }, { status: 503 });
  }
};
