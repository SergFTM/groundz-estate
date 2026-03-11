import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { createJobSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const job = await db.jobPosition.findUnique({
    where: { id: params.id },
    include: {
      applications: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!job) throw error(404, 'Job position not found');
  return { job };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const job = await db.jobPosition.findUnique({ where: { id: params.id } });
    if (!job) throw error(404, 'Job position not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = createJobSchema.parse(raw);
      await db.jobPosition.update({
        where: { id: params.id },
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
    const job = await db.jobPosition.findUnique({ where: { id: params.id } });
    if (!job) throw error(404, 'Job position not found');

    await db.jobPosition.delete({ where: { id: params.id } });
    throw redirect(303, '/admin/jobs');
  },

  deleteApplication: async ({ request, params }) => {
    const formData = await request.formData();
    const appId = formData.get('applicationId') as string;
    if (!appId) return { appError: 'Application ID missing' };

    const app = await db.jobApplication.findUnique({ where: { id: appId } });
    if (!app || app.positionId !== params.id) throw error(404, 'Application not found');

    await db.jobApplication.delete({ where: { id: appId } });
    return { appDeleted: true };
  },
} satisfies Actions;
