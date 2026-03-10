<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';

  let { data } = $props();

  let progressPct = $derived(
    data.pool.goalAmount > 0
      ? Math.min(100, Math.round((data.pool.raisedAmount / data.pool.goalAmount) * 100))
      : 0
  );
</script>

<svelte:head>
  <title>{data.pool.name} — Develta</title>
</svelte:head>

<div class="pool-detail-page">
  <a href="/investor/pools" class="back-link">← Back to Pools</a>

  <DetailCard title={data.pool.name} subtitle={data.pool.location ?? undefined}>
    <div class="pool-detail">
      <div class="pool-detail__status">
        <StatusBadge status={data.pool.status} />
      </div>

      <div class="pool-detail__grid">
        <div class="detail-item">
          <span class="detail-item__label">Goal Amount</span>
          <span class="detail-item__value">{formatCurrency(data.pool.goalAmount)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Raised Amount</span>
          <span class="detail-item__value">{formatCurrency(data.pool.raisedAmount)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Target Yield</span>
          <span class="detail-item__value">{data.pool.targetYield.toFixed(2)}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-item__label">Investors</span>
          <span class="detail-item__value">{data.pool.investments.length}</span>
        </div>
      </div>

      <div class="pool-detail__progress">
        <div class="progress-label">
          <span>Funding Progress</span>
          <span class="progress-percent">{progressPct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:{progressPct}%"></div>
        </div>
        <div class="progress-amounts">
          <span>{formatCurrency(data.pool.raisedAmount)} raised</span>
          <span>of {formatCurrency(data.pool.goalAmount)}</span>
        </div>
      </div>

      {#if data.pool.description}
        <div class="pool-detail__description">
          <h3 class="pool-detail__desc-title">About this Pool</h3>
          <p class="pool-detail__desc-text">{data.pool.description}</p>
        </div>
      {/if}
    </div>
  </DetailCard>
</div>

<style>
  .pool-detail-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 800px;
  }

  .back-link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    color: var(--color-text);
  }

  .pool-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .pool-detail__status {
    display: flex;
  }

  .pool-detail__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4);
    background: rgba(0, 0, 0, 0.02);
    border-radius: var(--radius-md);
  }

  .detail-item__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .detail-item__value {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
  }

  .pool-detail__progress {
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
    height: 8px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar__fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  .progress-amounts {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .pool-detail__description {
    padding-top: var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .pool-detail__desc-title {
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
  }

  .pool-detail__desc-text {
    font-size: var(--text-sm);
    color: var(--color-text-body);
    line-height: 1.7;
  }

  @media (max-width: 600px) {
    .pool-detail__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
