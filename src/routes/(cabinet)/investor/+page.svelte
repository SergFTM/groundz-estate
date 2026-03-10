<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>My Portfolio — Develta</title>
</svelte:head>

<div class="investor-dash">
  <div class="investor-dash__header">
    <span class="investor-dash__label">PORTFOLIO</span>
    <h1 class="investor-dash__title">My Portfolio</h1>
  </div>

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
                {#if investment.pool.location}
                  <p class="pool-card__location">{investment.pool.location}</p>
                {/if}
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
