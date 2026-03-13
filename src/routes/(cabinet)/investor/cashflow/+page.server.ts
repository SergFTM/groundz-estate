import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const investments = await db.investorInvestment.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        select: {
          id: true, name: true, slug: true, status: true,
          targetYield: true, targetIrr: true, termMonths: true,
          dealType: true, exitType: true,
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  // Build per-investment cashflow projection
  const projections = investments.map(inv => {
    const startDate = new Date(inv.createdAt);
    const exitDate = new Date(startDate);
    exitDate.setMonth(exitDate.getMonth() + inv.pool.termMonths);

    const yieldRate = inv.pool.targetIrr ?? inv.pool.targetYield; // annual %
    const annualReturn = inv.amount * (yieldRate / 100);
    const totalReturn = annualReturn * (inv.pool.termMonths / 12);
    const totalPayout = inv.amount + totalReturn;

    return {
      investmentId: inv.id,
      poolName: inv.pool.name,
      poolSlug: inv.pool.slug,
      status: inv.status,
      poolStatus: inv.pool.status,
      dealType: inv.pool.dealType,
      exitType: inv.pool.exitType,
      amount: inv.amount,
      yieldRate,
      termMonths: inv.pool.termMonths,
      startDate: startDate.toISOString(),
      exitDate: exitDate.toISOString(),
      annualReturn,
      totalReturn,
      totalPayout,
    };
  });

  // Aggregate KPIs
  const totalInvested = projections.reduce((s, p) => s + p.amount, 0);
  const totalProjectedReturn = projections.reduce((s, p) => s + p.totalReturn, 0);
  const totalProjectedPayout = totalInvested + totalProjectedReturn;
  const weightedYield = totalInvested > 0
    ? projections.reduce((s, p) => s + p.yieldRate * p.amount, 0) / totalInvested
    : 0;

  // Timeline: group exit payouts by calendar year
  const byYear: Record<number, { return: number; principal: number }> = {};
  for (const p of projections) {
    const yr = new Date(p.exitDate).getFullYear();
    if (!byYear[yr]) byYear[yr] = { return: 0, principal: 0 };
    byYear[yr].return += p.totalReturn;
    byYear[yr].principal += p.amount;
  }
  const timeline = Object.entries(byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, v]) => ({ year: Number(year), ...v, total: v.return + v.principal }));

  return {
    projections,
    kpis: { totalInvested, totalProjectedReturn, totalProjectedPayout, weightedYield },
    timeline,
  };
};
