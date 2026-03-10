import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const pools = await db.investmentPool.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return { pools };
};
