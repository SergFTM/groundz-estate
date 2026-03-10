import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const articles = await db.article.findMany({
    orderBy: { publishedAt: 'desc' },
  });
  return { articles };
};
