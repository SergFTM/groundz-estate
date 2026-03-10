<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<div class="buyer-dashboard">
  <!-- Widget 1: Alert Banner -->
  {#if data.alertPayment}
    <div class="alert-banner">
      <span class="alert-banner__icon">⚠</span>
      <span>
        <strong>Payment due soon:</strong>
        {formatCurrency(data.alertPayment.amount)} due {new Date(data.alertPayment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  {/if}

  <div class="dashboard-grid">
    <!-- Widget 2: My Property -->
    <div class="glass-card">
      <div class="glass-card__header">
        <h2 class="glass-card__title">My Property</h2>
      </div>
      {#if data.unit}
        <div class="glass-card__body">
          <div class="property-info">
            <div class="property-info__row">
              <span class="property-info__label">Project</span>
              <span class="property-info__value">{data.unit.project?.name ?? '—'}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Unit Code</span>
              <span class="property-info__value">{data.unit.code}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Type</span>
              <span class="property-info__value">{data.unit.type}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Bedrooms</span>
              <span class="property-info__value">{data.unit.bedrooms ?? '—'}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Floor</span>
              <span class="property-info__value">{data.unit.floor ?? '—'}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Area</span>
              <span class="property-info__value">{data.unit.areaSqm ? `${data.unit.areaSqm} m²` : '—'}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Price</span>
              <span class="property-info__value">{data.unit.price ? formatCurrency(data.unit.price) : '—'}</span>
            </div>
            <div class="property-info__row">
              <span class="property-info__label">Status</span>
              <span class="property-info__value"><StatusBadge status={data.unit.status} /></span>
            </div>
          </div>
        </div>
      {:else}
        <div class="glass-card__body glass-card__body--empty">
          <p class="empty-state">No property assigned yet. Contact your manager.</p>
        </div>
      {/if}
    </div>

    <!-- Widget 3: Next Payment -->
    {#if data.nextPayment}
      <div class="glass-card">
        <div class="glass-card__header">
          <h2 class="glass-card__title">Next Payment</h2>
        </div>
        <div class="glass-card__body glass-card__body--centered">
          <div class="payment-amount">{formatCurrency(data.nextPayment.amount)}</div>
          <div class="payment-due">Due {new Date(data.nextPayment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          {#if data.nextPayment.description}
            <div class="payment-desc">{data.nextPayment.description}</div>
          {/if}
          <div class="payment-status">
            <StatusBadge status={data.nextPayment.status} />
          </div>
        </div>
      </div>
    {/if}

    <!-- Widget 4: Construction Progress -->
    <div class="glass-card">
      <div class="glass-card__header">
        <h2 class="glass-card__title">Construction Progress</h2>
      </div>
      <div class="glass-card__body">
        <div class="progress-section">
          <div class="progress-label">
            <span>Overall Progress</span>
            <span class="progress-percent">{data.constructionProgress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width:{data.constructionProgress}%"></div>
          </div>
          <div class="progress-phase">
            <span class="progress-phase__label">Current Phase</span>
            <span class="progress-phase__value">{data.currentPhase}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Widget 5: Payment Schedule -->
    <div class="glass-card glass-card--full">
      <div class="glass-card__header">
        <h2 class="glass-card__title">Payment Schedule</h2>
      </div>
      <div class="glass-card__body glass-card__body--no-pad">
        {#if data.payments.length > 0}
          <div class="payment-list">
            {#each data.payments as payment}
              <div class="payment-row">
                <div class="payment-row__info">
                  <span class="payment-row__desc">{payment.description ?? 'Payment'}</span>
                  <span class="payment-row__date">{new Date(payment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div class="payment-row__right">
                  <span class="payment-row__amount">{formatCurrency(payment.amount)}</span>
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="glass-card__body">
            <p class="empty-state">No payments scheduled yet.</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Widget 6: Documents -->
    <div class="glass-card glass-card--full">
      <div class="glass-card__header">
        <h2 class="glass-card__title">Documents</h2>
      </div>
      <div class="glass-card__body glass-card__body--no-pad">
        {#if data.documents.length > 0}
          <div class="doc-list">
            {#each data.documents as doc}
              <div class="doc-row">
                <div class="doc-row__info">
                  <span class="doc-row__name">{doc.name}</span>
                  <span class="doc-row__meta">{doc.category} · {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div class="doc-row__right">
                  <StatusBadge status={doc.status} />
                  {#if doc.fileUrl}
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" class="doc-row__link">View</a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="glass-card__body">
            <p class="empty-state">No documents available yet.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Widget 7: ROI Summary -->
  {#if data.roi}
    <div class="roi-card">
      <div class="roi-card__header">
        <h2 class="roi-card__title">ROI Summary</h2>
        <span class="roi-card__subtitle">{data.roi.paidPercent}% paid</span>
      </div>
      <div class="roi-card__grid">
        <div class="roi-metric">
          <span class="roi-metric__label">Property Value</span>
          <span class="roi-metric__value">{formatCurrency(data.roi.propertyValue)}</span>
        </div>
        <div class="roi-metric">
          <span class="roi-metric__label">Total Paid</span>
          <span class="roi-metric__value">{formatCurrency(data.roi.totalPaid)}</span>
        </div>
        <div class="roi-metric">
          <span class="roi-metric__label">Annual Yield</span>
          <span class="roi-metric__value">{formatCurrency(data.roi.annualYield)}</span>
        </div>
        <div class="roi-metric">
          <span class="roi-metric__label">Net ROI</span>
          <span class="roi-metric__value roi-metric__value--highlight">{data.roi.netROI.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .buyer-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1200px;
  }

  /* Alert Banner */
  .alert-banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-lg);
    color: #92400e;
    font-size: var(--text-sm);
  }

  .alert-banner__icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  /* Dashboard Grid */
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }

  .glass-card--full {
    grid-column: 1 / -1;
  }

  /* Glass Card */
  .glass-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .glass-card__header {
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .glass-card__title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .glass-card__body {
    padding: var(--space-6);
  }

  .glass-card__body--no-pad {
    padding: 0;
  }

  .glass-card__body--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
  }

  .glass-card__body--centered {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-8) var(--space-6);
  }

  /* Property Info */
  .property-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .property-info__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  .property-info__row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .property-info__label {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .property-info__value {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-weight: 600;
    text-align: right;
  }

  /* Next Payment */
  .payment-amount {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 300;
    font-style: italic;
    color: var(--color-text);
    line-height: 1;
  }

  .payment-due {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .payment-desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .payment-status {
    margin-top: var(--space-1);
  }

  /* Construction Progress */
  .progress-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
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

  .progress-phase {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding-top: var(--space-2);
    border-top: 1px solid rgba(0, 0, 0, 0.04);
  }

  .progress-phase__label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .progress-phase__value {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-weight: 600;
  }

  /* Payment List */
  .payment-list {
    display: flex;
    flex-direction: column;
  }

  .payment-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    transition: background var(--transition-fast);
  }

  .payment-row:last-child {
    border-bottom: none;
  }

  .payment-row:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .payment-row__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .payment-row__desc {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .payment-row__date {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .payment-row__right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .payment-row__amount {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
  }

  /* Document List */
  .doc-list {
    display: flex;
    flex-direction: column;
  }

  .doc-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    transition: background var(--transition-fast);
  }

  .doc-row:last-child {
    border-bottom: none;
  }

  .doc-row:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .doc-row__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .doc-row__name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .doc-row__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .doc-row__right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .doc-row__link {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
    padding: 2px 8px;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .doc-row__link:hover {
    background: var(--color-accent);
    color: #fff;
  }

  /* Empty State */
  .empty-state {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }

  /* ROI Card */
  .roi-card {
    background: rgba(30, 30, 28, 0.85);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    color: #fff;
  }

  .roi-card__header {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-8);
  }

  .roi-card__title {
    font-size: var(--text-base);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #fff;
  }

  .roi-card__subtitle {
    font-size: var(--text-sm);
    color: rgba(255, 255, 255, 0.5);
  }

  .roi-card__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-6);
  }

  .roi-metric {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .roi-metric__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
  }

  .roi-metric__value {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 300;
    font-style: italic;
    color: #fff;
    line-height: 1;
  }

  .roi-metric__value--highlight {
    color: var(--color-accent);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .glass-card--full {
      grid-column: 1;
    }

    .roi-card__grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .roi-metric__value {
      font-size: 1.4rem;
    }
  }

  @media (max-width: 480px) {
    .roi-card__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
