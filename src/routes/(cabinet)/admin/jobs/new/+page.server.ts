import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createJobSchema } from '$lib/utils/validators';
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
      const data = createJobSchema.parse(raw);
      const job = await db.jobPosition.create({
        data: {
          title: data.title,
          slug: data.slug,
          department: data.department,
          location: data.location,
          type: data.type,
          description: data.description,
          isActive: data.isActive,
        },
      });
      throw redirect(303, `/admin/jobs/${job.id}/edit`);
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
