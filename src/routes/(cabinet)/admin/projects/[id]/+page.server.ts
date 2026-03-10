import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

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
