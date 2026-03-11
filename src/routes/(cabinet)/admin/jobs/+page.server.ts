import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const jobs = await db.jobPosition.findMany({
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { jobs };
};
