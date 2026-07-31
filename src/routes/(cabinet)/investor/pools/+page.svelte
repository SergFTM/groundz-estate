<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
  const { pools, commitMap } = data;

  function fmt(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `€${(n / 1000).toLocaleString()}k`;
    return `€${n}`;
  }
</script>

<svelte:head>
  <title>Investment Pools — Groundz</title>
</svelte:head>

<div class="pools-page">
  <div class="pools-page__header">
    <span class="pools-page__label">INVESTOR</span>
    <h1 class="pools-page__title">Investment Pools</h1>
  </div>

  {#if pools.length > 0}
    <div class="pools-grid">
      {#each pools as pool}
        {@const commit = commitMap[pool.id]}
        <div class="pool-card">
          <div class="pool-card__header">
            <div>
              <h2 class="pool-card__name">{pool.name}</h2>
              <p class="pool-card__location">{pool.projectName}</p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-1);">
              <StatusBadge status={pool.status} />
              {#if commit}
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;padding:2px 7px;border-radius:99px;background:rgba(212,169,68,0.12);color:#d4a944;">
                  {commit.status.replace('_', ' ')} · {fmt(commit.amount)}
                </span>
              {/if}
            </div>
          </div>

          <div class="pool-card__body">
            <div class="pool-card__stats">
              <div class="pool-stat">
                <span class="pool-stat__label">Goal</span>
                <span class="pool-stat__value">{formatCurrency(pool.goalAmount)}</span>
              </div>
              <div class="pool-stat">
                <span class="pool-stat__label">Raised</span>
                <span class="pool-stat__value">{formatCurrency(pool.raisedAmount)}</span>
              </div>
              <div class="pool-stat">
                <span class="pool-stat__label">Target Yield</span>
                <span class="pool-stat__value">{pool.targetYield.toFixed(2)}%</span>
              </div>
              <div class="pool-stat">
                <span class="pool-stat__label">Investors</span>
                <span class="pool-stat__value">{pool._count.investments}</span>
              </div>
            </div>

            <div class="pool-card__progress">
              <div class="progress-label">
                <span>Funded</span>
                <span class="progress-percent">
                  {pool.goalAmount > 0
                    ? Math.round((pool.raisedAmount / pool.goalAmount) * 100)
                    : 0}%
                </span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill"
                  style="width:{pool.goalAmount > 0 ? Math.min(100, (pool.raisedAmount / pool.goalAmount) * 100) : 0}%"
                ></div>
              </div>
            </div>
          </div>

          <div class="pool-card__footer" style="display:flex;justify-content:space-between;align-items:center;">
            <a href="/investor/pools/{pool.id}" class="pool-card__link">View Details →</a>
            {#if pool.status === 'active' && !commit}
              <a href="/pools/{pool.slug}/commit" class="pool-card__link" style="background:var(--color-accent);color:#fff;padding:var(--space-1) var(--space-3);border-radius:var(--radius-md);font-size:var(--text-xs);">Commit →</a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state-card">
      <p class="empty-state">No investment pools available at this time. <a href="/pools" style="color:var(--color-accent);font-weight:600;text-decoration:none;">Browse pools →</a></p>
    </div>
  {/if}
</div>

<style>
  .pools-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1100px;
  }

  .pools-page__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .pools-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .pools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-5);
  }

  .pool-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
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
    flex: 1;
  }

  .pool-card__stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .pool-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pool-stat__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .pool-stat__value {
    font-size: var(--text-sm);
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

  .pool-card__footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  .pool-card__link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
    transition: opacity var(--transition-fast);
  }

  .pool-card__link:hover {
    opacity: 0.75;
  }

  .empty-state-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-state {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }

  @media (max-width: 768px) {
    .pools-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
