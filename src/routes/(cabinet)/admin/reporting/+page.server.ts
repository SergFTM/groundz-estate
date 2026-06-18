import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [pools, investments, investors] = await Promise.all([
    db.pool.findMany({
      include: {
        investments: true,
        constructionReports: { orderBy: { reportDate: 'desc' }, take: 1 },
        _count: { select: { investments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.holding.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.user.findMany({
      where: { role: 'investor' },
      select: { id: true, createdAt: true },
    }),
  ]);

  // Platform-level KPIs
  const totalCommitted   = investments.reduce((s, i) => s + i.amount, 0);
  const totalFunded      = investments.filter(i => i.status === 'funded').reduce((s, i) => s + i.amount, 0);
  const totalGoal        = pools.reduce((s, p) => s + p.goalAmount, 0);
  const activePools      = pools.filter(p => p.status === 'active').length;
  const avgFillRate      = totalGoal > 0 ? (pools.reduce((s, p) => s + p.raisedAmount, 0) / totalGoal) * 100 : 0;
  const totalInvestors   = investors.length;

  // Per-pool rows
  const poolRows = pools.map(p => {
    const committed = p.investments.reduce((s, i) => s + i.amount, 0);
    const funded    = p.investments.filter(i => i.status === 'funded').reduce((s, i) => s + i.amount, 0);
    const fillPct   = p.goalAmount > 0 ? (p.raisedAmount / p.goalAmount) * 100 : 0;
    const latestReport = p.constructionReports[0] ?? null;
    return {
      id: p.id, name: p.name, slug: p.slug,
      status: p.status, dealType: p.dealType,
      goalAmount: p.goalAmount, raisedAmount: p.raisedAmount,
      targetYield: p.targetYield, termMonths: p.termMonths,
      fillPct, committed, funded,
      investorCount: p._count.investments,
      latestPct: latestReport?.overallPct ?? null,
      budgetVariancePct: latestReport
        ? latestReport.budgetTotal > 0
          ? ((latestReport.budgetSpent - latestReport.budgetTotal) / latestReport.budgetTotal) * 100
          : 0
        : null,
    };
  });

  // Monthly new investors (last 12 months)
  const now = new Date();
  const monthly: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = investors.filter(inv => {
      const t = new Date(inv.createdAt);
      return t >= d && t < next;
    }).length;
    monthly.push({
      month: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      count,
    });
  }

  return {
    kpis: { totalCommitted, totalFunded, totalGoal, activePools, avgFillRate, totalInvestors },
    poolRows,
    monthly,
  };
};
