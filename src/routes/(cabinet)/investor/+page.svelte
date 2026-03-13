<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();

  // AI Portfolio Insight
  let insightLoading = $state(false);
  let insight = $state<string | null>(null);
  let insightError = $state(false);

  async function loadInsight() {
    if (insight || insightLoading || data.investments.length === 0) return;
    insightLoading = true;
    insightError = false;
    try {
      const res = await fetch('/api/invest/portfolio-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: data.user?.id,
          portfolioData: {
            totalInvested: data.kpis.totalInvested,
            activePools: data.kpis.activePools,
            avgYield: data.kpis.avgYield,
            poolCount: data.investments.length,
            investments: data.investments.map(i => ({
              amount: i.amount,
              pool: {
                name: i.pool.name,
                status: i.pool.status,
                targetYield: i.pool.targetYield,
                raisedAmount: i.pool.raisedAmount,
                goalAmount: i.pool.goalAmount,
              },
            })),
          },
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      insight = d.insight;
    } catch {
      insightError = true;
    } finally {
      insightLoading = false;
    }
  }
</script>

<svelte:head>
  <title>My Portfolio — Develta</title>
</svelte:head>

<div class="investor-dash">
  <div class="investor-dash__header">
    <span class="investor-dash__label">PORTFOLIO</span>
    <h1 class="investor-dash__title">My Portfolio</h1>
  </div>

  <!-- AI Portfolio Insight -->
  {#if data.investments.length > 0}
    <div class="insight-widget">
      <div class="insight-widget__head">
        <span class="insight-widget__icon">✦</span>
        <span class="insight-widget__title">AI Portfolio Insight</span>
        {#if !insight && !insightLoading}
          <button class="insight-widget__btn" onclick={loadInsight}>Analyze my portfolio</button>
        {/if}
      </div>
      {#if insightLoading}
        <p class="insight-widget__loading">Analyzing your portfolio…</p>
      {:else if insight}
        <p class="insight-widget__text">{insight}</p>
        <button class="insight-widget__refresh" onclick={() => { insight = null; loadInsight(); }}>Refresh →</button>
      {:else if insightError}
        <p class="insight-widget__error">AI analysis unavailable right now.</p>
      {:else}
        <p class="insight-widget__hint">Get a personalized AI summary of your portfolio performance, risks, and recommendations.</p>
      {/if}
    </div>
  {/if}

  <div class="investor-dash__kpis">
    <div class="kpi-card">
      <span class="kpi-card__label">Total Invested</span>
      <span class="kpi-card__value">{formatCurrency(data.kpis.totalInvested)}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Active Pools</span>
      <span class="kpi-card__value">{data.kpis.activePools}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-card__label">Avg Yield</span>
      <span class="kpi-card__value">{data.kpis.avgYield.toFixed(2)}%</span>
    </div>
  </div>

  <div class="pool-list-section">
    <h2 class="pool-list-section__title">Investment Pools</h2>

    {#if data.investments.length > 0}
      <div class="pool-list">
        {#each data.investments as investment}
          <div class="pool-card">
            <div class="pool-card__header">
              <div>
                <h3 class="pool-card__name">{investment.pool.name}</h3>
                <p class="pool-card__location">{investment.pool.projectName}</p>
              </div>
              <StatusBadge status={investment.pool.status} />
            </div>

            <div class="pool-card__body">
              <div class="pool-card__meta">
                <div class="pool-meta-item">
                  <span class="pool-meta-item__label">My Investment</span>
                  <span class="pool-meta-item__value">{formatCurrency(investment.amount)}</span>
                </div>
                <div class="pool-meta-item">
                  <span class="pool-meta-item__label">Target Yield</span>
                  <span class="pool-meta-item__value">{investment.pool.targetYield.toFixed(2)}%</span>
                </div>
              </div>

              <div class="pool-card__progress">
                <div class="progress-label">
                  <span>Pool Progress</span>
                  <span class="progress-percent">
                    {investment.pool.goalAmount > 0
                      ? Math.round((investment.pool.raisedAmount / investment.pool.goalAmount) * 100)
                      : 0}%
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-bar__fill"
                    style="width:{investment.pool.goalAmount > 0 ? Math.min(100, (investment.pool.raisedAmount / investment.pool.goalAmount) * 100) : 0}%"
                  ></div>
                </div>
                <div class="progress-amounts">
                  <span>{formatCurrency(investment.pool.raisedAmount)} raised</span>
                  <span>of {formatCurrency(investment.pool.goalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state-card">
        <p class="empty-state">You have no investments yet. Browse available pools to get started.</p>
        <a href="/investor/pools" class="empty-state__link">Browse Pools →</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .investor-dash {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    max-width: 1100px;
  }

  .investor-dash__header {
    margin-bottom: var(--space-2);
  }

  .investor-dash__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .investor-dash__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .investor-dash__kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }

  .kpi-card {
    background: rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
  }

  .kpi-card__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .kpi-card__value {
    font-family: var(--font-display);
    font-weight: 300;
    font-style: italic;
    font-size: var(--text-4xl);
    color: var(--color-text);
    line-height: 1.2;
    margin-top: var(--space-2);
  }

  .pool-list-section__title {
    font-size: var(--text-base);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text);
    margin-bottom: var(--space-4);
  }

  .pool-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .pool-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .pool-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .pool-card__name {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
  }

  .pool-card__location {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin-top: 2px;
  }

  .pool-card__body {
    padding: var(--space-5) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .pool-card__meta {
    display: flex;
    gap: var(--space-8);
  }

  .pool-meta-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .pool-meta-item__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .pool-meta-item__value {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
  }

  .pool-card__progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .progress-percent {
    color: var(--color-accent);
  }

  .progress-bar {
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-bar__fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .progress-amounts {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .empty-state-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    text-align: center;
  }

  .empty-state {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .empty-state__link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
  }

  .empty-state__link:hover {
    text-decoration: underline;
  }

  /* AI Portfolio Insight widget */
  .insight-widget {
    background: linear-gradient(135deg, #fffdf8, #fdf5e6);
    border: 1px solid #f0e0b0;
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .insight-widget__head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .insight-widget__icon {
    color: var(--color-accent);
    font-size: var(--text-base);
  }

  .insight-widget__title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text);
    flex: 1;
  }

  .insight-widget__btn {
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    padding: 4px 12px;
    font-size: var(--text-xs);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .insight-widget__btn:hover { opacity: 0.85; }

  .insight-widget__text {
    font-size: var(--text-sm);
    color: var(--color-text);
    line-height: 1.65;
    margin: 0;
  }

  .insight-widget__loading,
  .insight-widget__hint,
  .insight-widget__error {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-style: italic;
  }
  .insight-widget__error { color: #e5484d; }

  .insight-widget__refresh {
    background: none;
    border: none;
    color: var(--color-accent);
    font-size: var(--text-xs);
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }
  .insight-widget__refresh:hover { text-decoration: underline; }

  @media (max-width: 768px) {
    .investor-dash__kpis {
      grid-template-columns: 1fr;
    }

    .pool-card__meta {
      flex-wrap: wrap;
      gap: var(--space-4);
    }
  }
</style>
