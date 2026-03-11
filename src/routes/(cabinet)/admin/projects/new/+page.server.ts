import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { updateProjectSchema } from '$lib/utils/validators';
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
      const data = updateProjectSchema.parse(raw);
      const project = await db.project.create({
        data: {
          name: data.name,
          slug: data.slug,
          location: data.location,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          status: data.status,
        },
      });
      throw redirect(303, `/admin/projects/${project.id}`);
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
