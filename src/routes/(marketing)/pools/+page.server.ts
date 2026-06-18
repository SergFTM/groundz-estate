import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const dealType = url.searchParams.get('dealType') ?? '';
  const country = url.searchParams.get('country') ?? '';
  const status = url.searchParams.get('status') ?? '';

  const pools = await db.investmentPool.findMany({
    where: {
      ...(dealType ? { dealType } : {}),
      ...(country ? { country } : {}),
      ...(status ? { status } : { status: { not: 'draft' } }),
    },
    include: {
      _count: { select: { investments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Trust bar aggregates
  const allPools = await db.investmentPool.findMany({
    where: { status: { not: 'draft' } },
    select: { goalAmount: true, raisedAmount: true, targetIrr: true, targetYield: true, termMonths: true, minTicket: true, developerCoinvestPct: true },
  });
  const investorCount = await db.investorInvestment.count();

  const totalAum = allPools.reduce((s, p) => s + p.goalAmount, 0);
  const totalRaised = allPools.reduce((s, p) => s + p.raisedAmount, 0);
  const avgIrr = allPools.length
    ? allPools.reduce((s, p) => s + (p.targetIrr ?? p.targetYield), 0) / allPools.length
    : 0;
  const minTicketAll = allPools.length ? Math.min(...allPools.map(p => p.minTicket)) : 0;
  const avgTerm = allPools.length
    ? allPools.reduce((s, p) => s + p.termMonths, 0) / allPools.length
    : 0;

  const trustBar = {
    totalAum,
    totalRaised,
    activeInvestors: investorCount,
    avgIrr: Math.round(avgIrr * 10) / 10,
    avgTermMonths: Math.round(avgTerm),
    minTicket: minTicketAll,
  };

  const indices = await db.marketIndex.findMany({
    where: { active: true },
    include: {
      prices: {
        where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
        orderBy: { date: 'asc' },
        select: { date: true, close: true, open: true, changePct: true },
      },
    },
  });

  return {
    pools,
    trustBar,
    filters: { dealType, country, status },
    indices,
    isLoggedIn: !!locals.user,
  };
};
