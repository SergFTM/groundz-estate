// POST /api/articles/comments — create comment or reply
// DELETE /api/articles/comments — delete own comment
import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import { callAI } from '$lib/server/seo/ai-client.js';
import { rateLimit } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

async function autoModCheck(commentId: string, content: string, userName: string): Promise<boolean> {
  try {
    const prompt = `You are a content moderator for a professional real estate investment platform.

Is this comment acceptable? Flag it if it contains spam, offensive language, harassment, misleading investment claims, or is completely irrelevant/gibberish.

Comment by "${userName}": ${content}

Reply with only a JSON object: {"verdict": "ok" | "flag", "reason": ""}`;

    const result = await callAI({
      systemPrompt: 'You are a strict content moderator. Return only valid JSON.',
      prompt,
      capability: 'comments.auto-mod',
    });

    let parsed: { verdict: string; reason: string };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      parsed = JSON.parse(result.content.replace(/```json|```/g, '').trim());
    }

    if (parsed.verdict === 'flag') {
      await db.articleComment.delete({ where: { id: commentId } });
      return true; // was deleted
    }
  } catch {
    // Auto-mod failure must never block comment creation
  }
  return false;
}

export const POST: RequestHandler = async (event) => {
  const { request, locals } = event;
  const user = locals.user;
  if (!user) return json({ error: 'Login required' }, { status: 401 });
  rateLimit(event, 'public');

  const body = await request.json().catch(() => null);
  if (!body?.articleId || !body?.content?.trim()) {
    return json({ error: 'articleId and content required' }, { status: 400 });
  }

  const comment = await db.articleComment.create({
    data: {
      articleId: body.articleId,
      userId: user.id,
      content: body.content.trim(),
      parentId: body.parentId ?? null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      likes: true,
      replies: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          likes: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Auto-moderation: check setting and silently remove if flagged
  const autoModSetting = await db.appSetting.findUnique({ where: { key: 'comment_auto_mod' } });
  if (autoModSetting?.value === 'true') {
    const deleted = await autoModCheck(comment.id, comment.content, user.name ?? user.email);
    if (deleted) return json({ error: 'Comment removed by auto-moderation' }, { status: 422 });
  }

  return json(comment, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.commentId) return json({ error: 'commentId required' }, { status: 400 });

  const comment = await db.articleComment.findUnique({ where: { id: body.commentId } });
  if (!comment) return json({ error: 'Not found' }, { status: 404 });

  const isAdmin = user.role === 'internal_team';
  if (comment.userId !== user.id && !isAdmin) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.articleComment.delete({ where: { id: body.commentId } });
  return json({ ok: true });
};
