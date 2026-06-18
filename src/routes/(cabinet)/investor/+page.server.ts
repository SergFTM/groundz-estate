import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const investments = await db.holding.findMany({
    where: { userId: user.id },
    include: { pool: true }
  });

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const activePools = investments.filter(i => i.pool.status === 'active').length;
  const avgYield = totalInvested > 0
    ? investments.reduce((s, i) => s + i.pool.targetYield * i.amount, 0) / totalInvested
    : 0;

  return { investments, kpis: { totalInvested, activePools, avgYield } };
};
