<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import DataTable from '$lib/components/cabinet/DataTable.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();

  const columns = [
    {
      key: 'unitCode',
      label: 'Unit Code',
      sortable: true
    },
    {
      key: 'amount',
      label: 'Amount (€)',
      sortable: true,
      render: (value: unknown) => formatCurrency(value as number)
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value: unknown) => new Date(value as string).toLocaleDateString('en-GB')
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, { bg: string; color: string }> = {
          paid: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
          upcoming: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
          overdue: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
        };
        const v = variants[status] ?? { bg: 'rgba(120,120,120,0.1)', color: '#787878' };
        const label = status.replace(/_/g, ' ');
        return `<span style="display:inline-flex;align-items:center;padding:3px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;border-radius:999px;white-space:nowrap;background:${v.bg};color:${v.color}">${label}</span>`;
      }
    }
  ];

  let rows = $derived(data.payments.map(p => ({
    unitCode: p.unit?.code ?? '—',
    amount: p.amount,
    dueDate: p.dueDate,
    status: p.status,
    description: p.description ?? ''
  })));
</script>

<div class="payments-page">
  <h1 class="page-title">Payments</h1>

  <DataTable {columns} {rows} searchable={true} />
</div>

<style>
  .payments-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1000px;
  }

  .page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
  }
</style>
