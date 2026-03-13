<script lang="ts">
  import { goto } from '$app/navigation';
  import DataTable from '$lib/components/cabinet/DataTable.svelte';

  let { data } = $props();

  let sourceFilter = $state('all');

  const SOURCES = ['all', 'investor_application', 'quiz', 'newsletter', 'brochure', 'call_booking'];
  const SOURCE_LABEL: Record<string, string> = {
    all: 'All',
    investor_application: 'Investor Apply',
    quiz: 'Quiz',
    newsletter: 'Newsletter',
    brochure: 'Brochure',
    call_booking: 'Call Booking',
  };

  let filtered = $derived(
    sourceFilter === 'all' ? data.leads : data.leads.filter((l: { source: string }) => l.source === sourceFilter)
  );

  const investorCount = $derived(
    data.leads.filter((l: { source: string }) => l.source === 'investor_application').length
  );

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'tag', label: 'Tag', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Date', sortable: true,
      render: (v: unknown) => v ? new Date(v as string).toLocaleDateString('en-GB') : '—' }
  ];
</script>

<svelte:head>
  <title>Leads — Admin — Develta</title>
</svelte:head>

<div>
  <div style="margin-bottom:var(--space-6);display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap;">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Leads</h1>
    </div>
    {#if investorCount > 0}
      <span style="font-size:var(--text-xs);font-weight:700;padding:var(--space-1) var(--space-3);border-radius:99px;background:rgba(212,169,68,0.12);color:var(--color-accent);">{investorCount} investor application{investorCount !== 1 ? 's' : ''}</span>
    {/if}
  </div>

  <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-5);">
    {#each SOURCES as s}
      <button
        onclick={() => sourceFilter = s}
        style="font-size:var(--text-xs);font-weight:700;padding:var(--space-1) var(--space-3);border-radius:var(--radius-md);border:1px solid {sourceFilter === s ? 'var(--color-accent)' : 'rgba(0,0,0,0.12)'};background:{sourceFilter === s ? 'var(--color-accent)' : 'transparent'};color:{sourceFilter === s ? '#fff' : 'var(--color-text-muted)'};cursor:pointer;"
      >{SOURCE_LABEL[s] ?? s}</button>
    {/each}
  </div>

  <DataTable
    {columns}
    rows={filtered}
    searchable={true}
    onRowClick={(row) => goto(`/admin/leads/${row.id}`)}
  />
</div>
