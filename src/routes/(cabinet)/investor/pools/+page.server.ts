import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const [pools, myInvestments] = await Promise.all([
    db.pool.findMany({
      include: { _count: { select: { investments: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    db.holding.findMany({
      where: { userId: user.id },
      select: { poolId: true, amount: true, status: true }
    }),
  ]);

  // Map poolId → commitment for quick lookup
  const commitMap = Object.fromEntries(myInvestments.map(i => [i.poolId, i]));

  return { pools, commitMap };
};
