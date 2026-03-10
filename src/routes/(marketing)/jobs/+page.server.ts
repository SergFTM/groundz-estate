import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const jobs = await db.jobPosition.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return { jobs };
};
