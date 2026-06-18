import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const comments = await db.articleComment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      article: { select: { id: true, title: true, slug: true } },
      likes: { select: { userId: true } },
      replies: { select: { id: true } },
    },
  });

  return { comments };
};
