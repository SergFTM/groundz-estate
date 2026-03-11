import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createFaqSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const faq = await db.fAQ.findUnique({ where: { id: params.id } });
  if (!faq) throw error(404, 'FAQ not found');
  return { faq };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const faq = await db.fAQ.findUnique({ where: { id: params.id } });
    if (!faq) throw error(404, 'FAQ not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createFaqSchema.parse(raw);
      await db.fAQ.update({
        where: { id: params.id },
        data: {
          question: data.question,
          answer: data.answer,
          category: data.category,
          sortOrder: data.sortOrder,
        },
      });
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
    const faq = await db.fAQ.findUnique({ where: { id: params.id } });
    if (!faq) throw error(404, 'FAQ not found');

    await db.fAQ.delete({ where: { id: params.id } });
    throw redirect(303, '/admin/faq');
  },
} satisfies Actions;
