<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import DataTable from '$lib/components/cabinet/DataTable.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();

  const columns = [
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: unknown) => formatCurrency(value as number)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, { bg: string; color: string }> = {
          paid: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
          approved: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
          pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
        };
        const v = variants[status] ?? { bg: 'rgba(120,120,120,0.1)', color: '#787878' };
        return `<span style="display:inline-flex;align-items:center;padding:3px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;border-radius:999px;white-space:nowrap;background:${v.bg};color:${v.color}">${status}</span>`;
      }
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value: unknown) => new Date(value as string).toLocaleDateString('en-GB')
    }
  ];

  let rows = $derived(data.commissions.map((c: { description: string; amount: number; status: string; createdAt: Date | string }) => ({
    description: c.description,
    amount: c.amount,
    status: c.status,
    createdAt: c.createdAt
  })));
</script>

<svelte:head>
  <title>Commissions — Groundz</title>
</svelte:head>

<div class="commissions-page">
  <div class="commissions-page__header">
    <span class="commissions-page__label">AGENT</span>
    <h1 class="commissions-page__title">Commissions</h1>
  </div>

  <div class="commission-totals">
    <div class="total-card">
      <span class="total-card__label">Pending</span>
      <span class="total-card__value total-card__value--warning">{formatCurrency(data.totals.pending)}</span>
    </div>
    <div class="total-card">
      <span class="total-card__label">Approved</span>
      <span class="total-card__value total-card__value--info">{formatCurrency(data.totals.approved)}</span>
    </div>
    <div class="total-card">
      <span class="total-card__label">Paid</span>
      <span class="total-card__value total-card__value--success">{formatCurrency(data.totals.paid)}</span>
    </div>
  </div>

  <DataTable {columns} {rows} searchable={true} />

  {#if data.commissions.length === 0}
    <p class="empty-state">No commissions recorded yet.</p>
  {/if}
</div>

<style>
  .commissions-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1000px;
  }

  .commissions-page__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .commissions-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .commission-totals {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }

  .total-card {
    background: rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
  }

  .total-card__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .total-card__value {
    font-family: var(--font-display);
    font-weight: 300;
    font-style: italic;
    font-size: var(--text-2xl);
    color: var(--color-text);
    line-height: 1.2;
    margin-top: var(--space-2);
  }

  .total-card__value--warning { color: #f59e0b; }
  .total-card__value--info { color: #3b82f6; }
  .total-card__value--success { color: #22c55e; }

  .empty-state {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-8);
  }

  @media (max-width: 600px) {
    .commission-totals {
      grid-template-columns: 1fr;
    }
  }
</style>
