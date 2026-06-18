// POST /api/articles/comments/moderate
// Analyses a batch of comments and returns verdicts.
// When autoDelete=true, also deletes flagged comments from DB.
import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { callAI } from '$lib/server/seo/ai-client.js';
import type { RequestHandler } from './$types';

export type Verdict = {
  commentId: string;
  verdict: 'ok' | 'flag';
  reason: string;
  category: 'spam' | 'offensive' | 'misleading' | 'irrelevant' | 'ok';
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'internal_team') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.comments?.length) return json({ error: 'comments required' }, { status: 400 });

  const { comments, autoDelete = false } = body as {
    comments: Array<{ id: string; content: string; userName: string }>;
    autoDelete?: boolean;
  };

  // Use numeric indices in the prompt — AI reliably returns numbers, not UUIDs
  const commentLines = comments
    .map((c, i) => `#${i} | Author: ${c.userName} | Content: ${c.content}`)
    .join('\n');

  const prompt = `You are a content moderator for Groundz — a professional real estate investment platform in Cyprus.

Review the following user comments and flag any that violate community standards.

Flag a comment if it contains:
- SPAM: advertising, promotional links, irrelevant offers, random symbols
- OFFENSIVE: hate speech, harassment, personal attacks, vulgar language
- MISLEADING: false investment claims, guaranteed returns, misinformation
- IRRELEVANT: completely off-topic, gibberish, test messages, random characters (like +++, ЗЗЗЮ, abc)

Comments:
${commentLines}

Return ONLY a JSON array with one entry per comment (no markdown, no extra text):
[
  {
    "index": <number matching the # above>,
    "verdict": "ok" or "flag",
    "reason": "<brief reason if flagged, empty string if ok>",
    "category": "ok" or "spam" or "offensive" or "misleading" or "irrelevant"
  }
]

Be strict: random symbols, test messages, and gibberish MUST be flagged as irrelevant.`;

  try {
    const result = await callAI({
      systemPrompt: 'You are a strict but fair content moderator. Return only valid JSON arrays.',
      prompt,
    });

    let raw: Array<{ index: number; verdict: string; reason: string; category: string }>;
    try {
      raw = JSON.parse(result.content);
    } catch {
      const cleaned = result.content.replace(/```json|```/g, '').trim();
      raw = JSON.parse(cleaned);
    }

    // Map indices back to real comment IDs
    const verdicts: Verdict[] = raw.map(r => ({
      commentId: comments[r.index]?.id ?? '',
      verdict: r.verdict as 'ok' | 'flag',
      reason: r.reason ?? '',
      category: r.category as Verdict['category'],
    })).filter(v => v.commentId);

    // Auto-delete flagged comments if requested
    let deletedIds: string[] = [];
    if (autoDelete) {
      const toDelete = verdicts.filter(v => v.verdict === 'flag').map(v => v.commentId);
      if (toDelete.length > 0) {
        await db.articleComment.deleteMany({ where: { id: { in: toDelete } } });
        deletedIds = toDelete;
      }
    }

    return json({ verdicts, deletedIds });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, { status: 503 });
  }
};
