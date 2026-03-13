import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  // Get all pools this investor has committed to
  const investments = await db.investorInvestment.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        select: {
          id: true, name: true, slug: true, status: true,
          targetYield: true, termMonths: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const poolIds = investments.map(i => i.pool.id);

  // Fetch milestones and latest construction report for each pool in parallel
  const [allMilestones, latestReports] = await Promise.all([
    db.milestone.findMany({
      where: { poolId: { in: poolIds } },
      orderBy: { plannedDate: 'asc' },
    }),
    // One latest report per pool
    db.constructionReport.findMany({
      where: { poolId: { in: poolIds } },
      orderBy: { reportDate: 'desc' },
      distinct: ['poolId'],
    }),
  ]);

  const reportMap = Object.fromEntries(latestReports.map(r => [r.poolId, r]));
  const now = new Date();

  const pools = investments.map(inv => {
    const milestones = allMilestones.filter(m => m.poolId === inv.pool.id);
    const report = reportMap[inv.pool.id] ?? null;

    // Milestone status helpers
    const completed = milestones.filter(m => m.status === 'completed');
    const overallPct = report?.overallPct
      ?? (milestones.length > 0
        ? Math.round(milestones.reduce((s, m) => s + m.completionPct, 0) / milestones.length)
        : 0);

    // Delay flag: any non-completed milestone whose plannedDate is > 14 days past
    const delayed = milestones.filter(m =>
      m.status !== 'completed' &&
      now.getTime() - new Date(m.plannedDate).getTime() > 14 * 24 * 60 * 60 * 1000
    );

    // Budget variance %
    const budgetVariancePct = report && report.budgetTotal > 0
      ? ((report.budgetSpent - report.budgetTotal) / report.budgetTotal) * 100
      : 0;

    return {
      investment: inv,
      pool: inv.pool,
      milestones,
      completedCount: completed.length,
      overallPct,
      delayed,
      report,
      budgetVariancePct,
    };
  });

  return { pools };
};
