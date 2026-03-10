<script lang="ts">
  import DataTable from '$lib/components/cabinet/DataTable.svelte';
  import { formatCurrency } from '$lib/utils/formatters';

  let { data } = $props();

  const columns = [
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (_v: unknown, row: Record<string, unknown>) => {
        const user = row.user as { name?: string | null; email: string } | null;
        if (!user) return '—';
        return user.name || user.email;
      }
    },
    {
      key: 'unit',
      label: 'Unit Code',
      sortable: true,
      render: (_v: unknown, row: Record<string, unknown>) => {
        const unit = row.unit as { code: string } | null;
        return unit?.code ?? '—';
      }
    },
    {
      key: 'amount',
      label: 'Amount (€)',
      sortable: true,
      render: (v: unknown) => v != null ? formatCurrency(v as number) : '—'
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (v: unknown) => v ? new Date(v as string).toLocaleDateString('en-GB') : '—'
    },
    { key: 'status', label: 'Status', sortable: true }
  ];
</script>

<svelte:head>
  <title>Payments — Admin — Develta</title>
</svelte:head>

<div>
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Payments</h1>
  </div>

  <DataTable
    {columns}
    rows={data.payments}
    searchable={true}
  />
</div>
