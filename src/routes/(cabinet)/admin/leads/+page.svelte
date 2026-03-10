<script lang="ts">
  import { goto } from '$app/navigation';
  import DataTable from '$lib/components/cabinet/DataTable.svelte';

  let { data } = $props();

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
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Leads</h1>
  </div>

  <DataTable
    {columns}
    rows={data.leads}
    searchable={true}
    onRowClick={(row) => goto(`/admin/leads/${row.id}`)}
  />
</div>
