import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const article = await db.article.findUnique({
    where: { slug: params.slug },
  });

  if (!article) throw error(404, 'Article not found');

  const [others, seoProfile, comments] = await Promise.all([
    db.article.findMany({
      where: { NOT: { slug: params.slug } },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }),
    db.seoPageProfile.findUnique({
      where: { articleId: article.id },
      select: { metaTitle: true, metaDescription: true },
    }),
    db.articleComment.findMany({
      where: { articleId: article.id, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        likes: { select: { userId: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            likes: { select: { userId: true } },
          },
        },
      },
    }),
  ]);

  const related = others.sort(() => Math.random() - 0.5).slice(0, 3);

  // article.content is admin/seed-authored HTML — trusted source.
  // If a WYSIWYG CMS editor is introduced, sanitize via isomorphic-dompurify before returning.
  return { article, related, seoProfile, comments, currentUser: locals.user ?? null };
};
