import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const investments = await db.investorInvestment.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        select: {
          id: true, name: true, slug: true, country: true, city: true,
          dealType: true, status: true, targetYield: true, targetIrr: true,
          termMonths: true, createdAt: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalCommitted = investments.reduce((s, i) => s + i.amount, 0);

  // Geography allocation
  const byCountry: Record<string, number> = {};
  for (const inv of investments) {
    const c = inv.pool.country || 'Other';
    byCountry[c] = (byCountry[c] ?? 0) + inv.amount;
  }

  // Strategy (deal type) allocation
  const byStrategy: Record<string, number> = {};
  for (const inv of investments) {
    const s = inv.pool.dealType || 'unspecified';
    byStrategy[s] = (byStrategy[s] ?? 0) + inv.amount;
  }

  // Status allocation
  const byStatus: Record<string, number> = {};
  for (const inv of investments) {
    byStatus[inv.status] = (byStatus[inv.status] ?? 0) + inv.amount;
  }

  // Maturity bucket (months from createdAt + termMonths)
  const now = new Date();
  const byMaturity: Record<string, number> = { '< 6m': 0, '6–12m': 0, '12–24m': 0, '24m+': 0 };
  for (const inv of investments) {
    const exitDate = new Date(inv.createdAt);
    exitDate.setMonth(exitDate.getMonth() + inv.pool.termMonths);
    const monthsLeft = Math.max(0, (exitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsLeft < 6) byMaturity['< 6m'] += inv.amount;
    else if (monthsLeft < 12) byMaturity['6–12m'] += inv.amount;
    else if (monthsLeft < 24) byMaturity['12–24m'] += inv.amount;
    else byMaturity['24m+'] += inv.amount;
  }

  return {
    investments,
    totalCommitted,
    charts: { byCountry, byStrategy, byStatus, byMaturity }
  };
};
