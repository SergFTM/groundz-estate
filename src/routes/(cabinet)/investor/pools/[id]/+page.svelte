<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';

  let { data, form } = $props();

  let formResult = $derived(form as { investSuccess?: boolean; error?: string } | null);

  let progressPct = $derived(
    data.pool.goalAmount > 0
      ? Math.min(100, Math.round((data.pool.raisedAmount / data.pool.goalAmount) * 100))
      : 0
  );

  const CATEGORY_LABEL: Record<string, string> = {
    floor_plan:             '📐 Floor Plan',
    subscription_agreement: '📋 Subscription Agreement',
    contract:               '📄 Contract',
    kyc:                    '✅ KYC',
    other:                  '📁 Other',
  };

  const MILESTONE_ICON: Record<string, string> = {
    completed:   '✅',
    in_progress: '🔄',
    delayed:     '⚠️',
    pending:     '⏳',
  };

  function fmtSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return bytes > 0 ? `${bytes} B` : '';
  }
</script>

<svelte:head>
  <title>{data.pool.name} — Groundz</title>
</svelte:head>

<div class="pool-detail-page">
  <a href="/investor/pools" class="back-link">← Back to Pools</a>

  <DetailCard title={data.pool.name} subtitle={data.pool.projectName ?? undefined}>
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

      <!-- Milestones (only if committed) -->
      {#if data.myCommit && data.pool.milestones.length > 0}
        <div class="pool-detail__section">
          <h3 class="pool-detail__section-title">Milestones</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);">
            {#each data.pool.milestones as ms}
              <div style="display:flex;align-items:center;gap:var(--space-3);">
                <span style="font-size:16px;flex-shrink:0;">{MILESTONE_ICON[ms.status] ?? '⏳'}</span>
                <div style="flex:1;min-width:0;">
                  <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{ms.name}</p>
                  <p style="font-size:10px;color:var(--color-text-muted);">
                    {ms.actualDate ? `Completed ${formatDate(ms.actualDate)}` : `Planned ${formatDate(ms.plannedDate)}`}
                  </p>
                </div>
                <span style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);">{ms.completionPct}%</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Data Room (only for committed investors) -->
      {#if data.myCommit && data.pool.documents.length > 0}
        <div class="pool-detail__section">
          <h3 class="pool-detail__section-title">Data Room</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            {#each data.pool.documents as doc}
              <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:rgba(0,0,0,0.02);border-radius:var(--radius-md);">
                <div style="flex:1;min-width:0;">
                  <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{CATEGORY_LABEL[doc.category] ?? doc.category} — {doc.name}</p>
                  {#if doc.fileSize > 0}
                    <p style="font-size:10px;color:var(--color-text-muted);">{fmtSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}</p>
                  {/if}
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);text-decoration:none;flex-shrink:0;">Download →</a>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if data.pool.status === 'active'}
        <div class="pool-detail__invest">
          <h3 class="pool-detail__invest-title">Invest in this Pool</h3>

          {#if formResult?.investSuccess}
            <div class="success-msg">Your investment has been recorded successfully.</div>
          {/if}
          {#if formResult?.error}
            <div class="error-msg">{formResult.error}</div>
          {/if}

          <form
            method="POST"
            action="?/invest"
            use:enhance={() => {
              return async ({ update }) => {
                await update();
                await invalidateAll();
              };
            }}
          >
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="investAmount">Amount (€)</label>
              <input
                class="form-input"
                type="number"
                id="investAmount"
                name="amount"
                min={data.pool.minTicket}
                max={data.pool.goalAmount - data.pool.raisedAmount}
                step="0.01"
                placeholder="Enter amount"
                required
              />
              <p class="form-hint">Min. ticket: {formatCurrency(data.pool.minTicket)} · Available: {formatCurrency(data.pool.goalAmount - data.pool.raisedAmount)}</p>
            </div>
            <button type="submit" class="btn btn--primary" style="margin-top:var(--space-4);">Submit Investment</button>
          </form>
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

  .pool-detail__section {
    padding-top: var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .pool-detail__section-title {
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
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

  .pool-detail__invest {
    padding-top: var(--space-4);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .pool-detail__invest-title {
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }

  .form-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }

  .success-msg {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
    color: #22c55e;
  }

  .error-msg {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
    color: #ef4444;
  }

  @media (max-width: 600px) {
    .pool-detail__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
