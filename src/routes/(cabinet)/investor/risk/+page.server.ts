import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

function hhi(shares: number[]): number {
  // Herfindahl-Hirschman Index — 0 (perfect spread) to 10000 (fully concentrated)
  // Normalise to 0–100 risk score
  const raw = shares.reduce((s, pct) => s + pct * pct, 0);
  // HHI: 100² = 10000 (one pool), 1/n * n * (100/n)² = 10000/n (equal split)
  // Map to 0–100: risk = (raw - 10000/n) / (10000 - 10000/n)  clamped to [0,1]
  const n = shares.length;
  if (n === 0) return 0;
  if (n === 1) return 100;
  const minHHI = 10000 / n;
  return Math.round(Math.min(100, Math.max(0, ((raw - minHHI) / (10000 - minHHI)) * 100)));
}

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const investments = await db.holding.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        select: {
          id: true, name: true, slug: true, status: true,
          country: true, dealType: true,
          targetYield: true, targetIrr: true, termMonths: true,
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  if (investments.length === 0) {
    return { riskMetrics: null, investments: [] };
  }

  const total = investments.reduce((s, i) => s + i.amount, 0);
  const shares = investments.map(i => (i.amount / total) * 100);

  // 1. Concentration risk (pool-level HHI)
  const concentrationScore = hhi(shares);

  // 2. Geographic risk
  const geoMap: Record<string, number> = {};
  for (const inv of investments) {
    const c = inv.pool.country || 'Other';
    geoMap[c] = (geoMap[c] ?? 0) + inv.amount;
  }
  const geoShares = Object.values(geoMap).map(v => (v / total) * 100);
  const geographyScore = hhi(geoShares);
  const topGeo = Object.entries(geoMap).sort(([,a],[,b]) => b - a)[0];
  const topGeoPct = Math.round((topGeo[1] / total) * 100);

  // 3. Strategy risk
  const stratMap: Record<string, number> = {};
  for (const inv of investments) {
    const s = inv.pool.dealType || 'unspecified';
    stratMap[s] = (stratMap[s] ?? 0) + inv.amount;
  }
  const stratShares = Object.values(stratMap).map(v => (v / total) * 100);
  const strategyScore = hhi(stratShares);

  // 4. Liquidity risk: % not yet funded = pending + soft_commit
  const unfundedAmt = investments
    .filter(i => i.status !== 'funded')
    .reduce((s, i) => s + i.amount, 0);
  const liquidityScore = Math.round((unfundedAmt / total) * 100);

  // 5. Maturity clustering: % of exits falling in same 12-month window
  const now = new Date();
  const exitsByYear: Record<number, number> = {};
  for (const inv of investments) {
    const exit = new Date(inv.createdAt);
    exit.setMonth(exit.getMonth() + inv.pool.termMonths);
    const yr = exit.getFullYear();
    exitsByYear[yr] = (exitsByYear[yr] ?? 0) + inv.amount;
  }
  const maxYearAmt = Math.max(...Object.values(exitsByYear), 0);
  const maturityScore = Math.round((maxYearAmt / total) * 100);

  // 6. Yield vs benchmark (platform avg ~9%)
  const BENCHMARK = 9;
  const weightedYield = investments.reduce((s, i) => {
    const y = i.pool.targetIrr ?? i.pool.targetYield;
    return s + y * i.amount;
  }, 0) / total;
  // Risk if very low (< 6%) or very high (> 14%)
  const yieldDeviation = Math.abs(weightedYield - BENCHMARK);
  const yieldScore = Math.min(100, Math.round((yieldDeviation / 10) * 100));

  // Overall composite risk (simple average)
  const overallScore = Math.round(
    (concentrationScore + geographyScore + strategyScore + liquidityScore + maturityScore + yieldScore) / 6
  );

  const riskMetrics = {
    overallScore,
    metrics: [
      {
        key: 'concentration',
        label: 'Pool Concentration',
        score: concentrationScore,
        detail: `${investments.length} pool${investments.length !== 1 ? 's' : ''} — top pool ${Math.round(shares[shares.indexOf(Math.max(...shares))])}% of portfolio`,
      },
      {
        key: 'geography',
        label: 'Geographic Concentration',
        score: geographyScore,
        detail: `${Object.keys(geoMap).length} countr${Object.keys(geoMap).length !== 1 ? 'ies' : 'y'} — ${topGeo[0]} ${topGeoPct}% of portfolio`,
      },
      {
        key: 'strategy',
        label: 'Strategy Concentration',
        score: strategyScore,
        detail: `${Object.keys(stratMap).length} deal type${Object.keys(stratMap).length !== 1 ? 's' : ''} in portfolio`,
      },
      {
        key: 'liquidity',
        label: 'Liquidity Risk',
        score: liquidityScore,
        detail: `${liquidityScore}% of commitments pending funding`,
      },
      {
        key: 'maturity',
        label: 'Maturity Clustering',
        score: maturityScore,
        detail: `${maturityScore}% of exits concentrated in a single calendar year`,
      },
      {
        key: 'yield',
        label: 'Yield vs Benchmark',
        score: yieldScore,
        detail: `Portfolio avg ${weightedYield.toFixed(1)}% vs platform benchmark ${BENCHMARK}%`,
      },
    ],
    weightedYield,
    poolCount: investments.length,
    geoCount: Object.keys(geoMap).length,
    stratCount: Object.keys(stratMap).length,
    liquidityScore,
    maturityScore,
  };

  return { riskMetrics, investments };
};
