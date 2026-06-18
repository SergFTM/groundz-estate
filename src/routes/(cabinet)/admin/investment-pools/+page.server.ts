import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const pools = await db.pool.findMany({
    include: { _count: { select: { investments: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { pools };
};
