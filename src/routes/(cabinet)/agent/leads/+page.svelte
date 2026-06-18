<script lang="ts">
  import DataTable from '$lib/components/cabinet/DataTable.svelte';

  let { data } = $props();

  function badgeHtml(status: string): string {
    const variants: Record<string, { bg: string; color: string }> = {
      paid: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
      approved: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
      active: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
      completed: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
      converted: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
      upcoming: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      warm: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      new: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      contacted: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      overdue: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      action_required: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      hot: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      cold: { bg: 'rgba(120,120,120,0.1)', color: '#787878' },
      reserved: { bg: 'rgba(120,120,120,0.1)', color: '#787878' },
      lost: { bg: 'rgba(120,120,120,0.1)', color: '#787878' }
    };
    const v = variants[status] ?? { bg: 'rgba(120,120,120,0.1)', color: '#787878' };
    const label = status.replace(/_/g, ' ');
    return `<span style="display:inline-flex;align-items:center;padding:3px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;border-radius:999px;white-space:nowrap;background:${v.bg};color:${v.color}">${label}</span>`;
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    {
      key: 'tag',
      label: 'Tag',
      render: (value: unknown) => value ? badgeHtml(value as string) : '—'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => badgeHtml(value as string)
    },
    {
      key: 'assigned',
      label: 'Assigned',
      render: (_value: unknown, row: Record<string, unknown>) =>
        row.agentId === data.userId ? '<span style="color:#22c55e;font-weight:700;">Me</span>' : '—'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, row: Record<string, unknown>) =>
        row.agentId === data.userId
          ? `<a href="/agent/leads/${row.id}" style="font-size:var(--text-xs,12px);font-weight:600;color:var(--color-accent,#b8874e);text-decoration:none;padding:2px 8px;border:1px solid var(--color-accent,#b8874e);border-radius:4px;">Edit</a>`
          : '—'
    }
  ];

  let rows = $derived(data.leads.map((l: {
    id: string;
    name: string | null;
    email: string | null;
    source: string;
    tag: string | null;
    status: string;
    agentId: string | null;
  }) => ({
    id: l.id,
    name: l.name ?? '—',
    email: l.email ?? '—',
    source: l.source,
    tag: l.tag ?? '',
    status: l.status,
    agentId: l.agentId,
    assigned: l.agentId
  })));
</script>

<svelte:head>
  <title>All Leads — Groundz</title>
</svelte:head>

<div class="leads-page">
  <div class="leads-page__header">
    <span class="leads-page__label">AGENT</span>
    <h1 class="leads-page__title">All Leads</h1>
  </div>

  <DataTable {columns} {rows} searchable={true} />
</div>

<style>
  .leads-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1200px;
  }

  .leads-page__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .leads-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }
</style>
