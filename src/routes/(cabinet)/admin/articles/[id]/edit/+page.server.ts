import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createArticleSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import { runSeoAudit } from '$lib/server/seo/orchestrator.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [article, seoProfile] = await Promise.all([
    db.article.findUnique({ where: { id: params.id } }),
    db.seoPageProfile.findUnique({
      where: { articleId: params.id },
      select: { id: true },
    }),
  ]);
  if (!article) throw error(404, 'Article not found');
  return { article, seoProfileId: seoProfile?.id ?? null };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const article = await db.article.findUnique({ where: { id: params.id } });
    if (!article) throw error(404, 'Article not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createArticleSchema.parse(raw);
      await db.article.update({
        where: { id: params.id },
        data: {
          title: data.title,
          slug: data.slug,
          category: data.category,
          excerpt: data.excerpt || null,
          content: data.content,
          imageUrl: data.imageUrl || null,
        },
      });

      // Fire-and-forget SEO audit — does not block the save response
      const auditHtml = `<html><head><title>${data.title}</title><meta name="description" content="${data.excerpt ?? ''}"><link rel="canonical" href="/knowledge/${data.slug}"></head><body>${data.content}</body></html>`;
      runSeoAudit({
        articleId: params.id,
        route: `/knowledge/${data.slug}`,
        html: auditHtml,
        locale: 'en',
        pageType: 'article',
      }).catch(() => null);

      return { success: true };
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  },

  delete: async ({ params }) => {
    const article = await db.article.findUnique({ where: { id: params.id } });
    if (!article) throw error(404, 'Article not found');

    await db.article.delete({ where: { id: params.id } });
    throw redirect(303, '/admin/articles');
  },
} satisfies Actions;
