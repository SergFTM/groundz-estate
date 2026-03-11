import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { updateProjectSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project) throw error(404, 'Project not found');
  return { project };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const project = await db.project.findUnique({ where: { id: params.id } });
    if (!project) throw error(404, 'Project not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = updateProjectSchema.parse(raw);
      await db.project.update({
        where: { id: params.id },
        data: {
          name: data.name,
          slug: data.slug,
          location: data.location,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          status: data.status,
        },
      });
      throw redirect(303, `/admin/projects/${params.id}`);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  },

  deleteProject: async ({ params }) => {
    const project = await db.project.findUnique({ where: { id: params.id } });
    if (!project) throw error(404, 'Project not found');

    await db.project.delete({ where: { id: params.id } });
    throw redirect(303, '/admin/projects');
  },
} satisfies Actions;
