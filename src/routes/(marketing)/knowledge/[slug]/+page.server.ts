import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const article = await db.article.findUnique({
    where: { slug: params.slug },
  });

  if (!article) throw error(404, 'Article not found');

  const others = await db.article.findMany({
    where: { NOT: { slug: params.slug } },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });

  const related = others
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return { article, related };
};
