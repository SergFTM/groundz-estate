import db from '$lib/server/db';
import { createProjectSchema } from '$lib/utils/validators';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const projects = await db.project.findMany({
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { projects };
};

export const actions: Actions = {
  createProject: async ({ request }) => {
    const parsed = createProjectSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
    await db.project.create({ data: parsed.data });
    return { success: true };
  }
};
