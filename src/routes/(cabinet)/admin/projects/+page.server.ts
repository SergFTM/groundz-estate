import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const projects = await db.project.findMany({
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { projects };
};
