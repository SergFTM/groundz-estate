import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createArticleSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createArticleSchema.parse(raw);
      const article = await db.article.create({
        data: {
          title: data.title,
          slug: data.slug,
          category: data.category,
          excerpt: data.excerpt || null,
          content: data.content,
          imageUrl: data.imageUrl || null,
        },
      });
      throw redirect(303, `/admin/articles/${article.id}/edit`);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  },
} satisfies Actions;
