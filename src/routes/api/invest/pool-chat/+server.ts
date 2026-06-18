// POST /api/invest/pool-chat — contextual AI chat for a specific investment pool.
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { localChat } from '$lib/server/local-llm.js';
import { aiGuard } from '$lib/server/ai-guard.js';
import type { RequestHandler } from './$types';

const MAX_HISTORY = 8;
const MAX_MSG_LEN = 600;

export const POST: RequestHandler = async (event) => {
  aiGuard(event, { roles: 'any', bucket: 'chat' });

  const body = await event.request.json().catch(() => null);
  if (!body?.poolId || !body?.message) {
    return json({ error: 'poolId and message required' }, { status: 400 });
  }

  const { poolId, message, history = [] } = body as {
    poolId: string;
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  };

  const msg = String(message).slice(0, MAX_MSG_LEN).trim();
  if (!msg) return json({ error: 'Empty message' }, { status: 400 });

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    include: {
      milestones: { orderBy: { plannedDate: 'asc' } },
      constructionReports: { orderBy: { reportDate: 'desc' }, take: 1 },
    },
  });
  if (!pool) return json({ error: 'Pool not found' }, { status: 404 });

  const latestReport = pool.constructionReports[0] ?? null;
  const completedMs = pool.milestones.filter(m => m.status === 'completed').length;
  const totalMs = pool.milestones.length;

  const poolContext = [
    `Investment Pool: ${pool.name}`,
    `Location: ${pool.city ? `${pool.city}, ` : ''}${pool.country}`,
    `Status: ${pool.status}`,
    `Deal type: ${pool.dealType ?? 'N/A'} | Capital: ${pool.capitalType ?? 'N/A'} | Exit: ${pool.exitType ?? 'N/A'}`,
    `Target IRR: ${pool.targetIrr ?? pool.targetYield}% | Preferred return: ${pool.preferredReturn ?? 'N/A'}%`,
    `Term: ${pool.termMonths} months | Min ticket: €${pool.minTicket?.toLocaleString()} | Max: ${pool.maxTicket ? `€${pool.maxTicket.toLocaleString()}` : 'N/A'}`,
    `Goal: €${pool.goalAmount?.toLocaleString()} | Raised: €${pool.raisedAmount?.toLocaleString()} (${pool.goalAmount > 0 ? Math.round((pool.raisedAmount / pool.goalAmount) * 100) : 0}%)`,
    `LTV: ${pool.ltv ?? 'N/A'}% | LTC: ${pool.ltc ?? 'N/A'}% | SPV: ${pool.spvName ?? 'N/A'}`,
    `Developer co-invest: ${pool.developerCoinvestPct ?? 'N/A'}%`,
    pool.description ? `Description: ${pool.description}` : null,
    pool.locationThesis ? `Location thesis: ${pool.locationThesis}` : null,
    pool.demandThesis ? `Demand thesis: ${pool.demandThesis}` : null,
    pool.constructionThesis ? `Construction thesis: ${pool.constructionThesis}` : null,
    pool.exitThesis ? `Exit thesis: ${pool.exitThesis}` : null,
    totalMs > 0 ? `Construction: ${completedMs}/${totalMs} milestones done${latestReport ? `, overall ${latestReport.overallPct}% complete` : ''}` : null,
  ].filter(Boolean).join('\n');

  const safeHistory = Array.isArray(history)
    ? history
        .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-MAX_HISTORY)
    : [];

  const conversation = safeHistory
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `${conversation ? conversation + '\n' : ''}User: ${msg}\nAssistant:`;

  const systemPrompt = `You are an expert investment advisor for the Groundz platform, answering questions about a specific real estate investment pool.

POOL DATA:
${poolContext}

RULES:
- Answer only questions about this pool or general real estate investment concepts
- Be concise — max 3 short paragraphs
- Use specific numbers from the pool data when relevant
- Never guarantee returns; use "target", "projected", "expected"
- If asked something outside your knowledge, say so honestly
- Answer in the same language the user writes in (English or Russian)`;

  try {
    const result = await localChat({
      systemPrompt, prompt,
      temperature: 0.4, maxTokens: 600,
      capability: 'invest.pool-chat',
    });
    return json({ reply: result.content });
  } catch {
    return json({ error: 'AI unavailable' }, { status: 503 });
  }
};
