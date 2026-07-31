// POST /api/articles/comments/like — toggle like on a comment
import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.commentId) return json({ error: 'commentId required' }, { status: 400 });

  const existing = await db.articleCommentLike.findUnique({
    where: { commentId_userId: { commentId: body.commentId, userId: user.id } },
  });

  if (existing) {
    await db.articleCommentLike.delete({
      where: { commentId_userId: { commentId: body.commentId, userId: user.id } },
    });
    return json({ liked: false });
  } else {
    await db.articleCommentLike.create({
      data: { commentId: body.commentId, userId: user.id },
    });
    return json({ liked: true });
  }
};
