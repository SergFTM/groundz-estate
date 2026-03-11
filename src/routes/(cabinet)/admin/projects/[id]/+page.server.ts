import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { addUnitSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      units: { orderBy: { code: 'asc' } },
      constructionPhases: {
        orderBy: { sortOrder: 'asc' },
        include: { media: true }
      }
    }
  });
  if (!project) throw error(404, 'Project not found');
  return { project };
};

export const actions: Actions = {
  addUnit: async ({ request, params }) => {
    const project = await db.project.findUnique({ where: { id: params.id } });
    if (!project) throw error(404, 'Project not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = addUnitSchema.parse(raw);
      await db.unit.create({
        data: {
          projectId: params.id,
          code: data.code,
          type: data.type,
          bedrooms: data.bedrooms,
          floor: data.floor,
          areaSqm: data.areaSqm,
          price: data.price ?? null,
          status: data.status,
        },
      });
      return { unitSuccess: true };
    } catch (err) {
      if (err instanceof ZodError) {
        const unitErrors: Record<string, string> = {};
        for (const issue of err.issues) unitErrors[issue.path[0] as string] = issue.message;
        return { unitErrors };
      }
      throw err;
    }
  },

  deleteUnit: async ({ request, params }) => {
    const project = await db.project.findUnique({ where: { id: params.id } });
    if (!project) throw error(404, 'Project not found');

    const formData = await request.formData();
    const unitId = formData.get('unitId') as string;
    if (!unitId) return { unitErrors: { general: 'Unit ID missing' } };

    const unit = await db.unit.findUnique({ where: { id: unitId } });
    if (!unit || unit.projectId !== params.id) throw error(404, 'Unit not found');

    await db.unit.delete({ where: { id: unitId } });
    return { unitSuccess: true };
  },
} satisfies Actions;
