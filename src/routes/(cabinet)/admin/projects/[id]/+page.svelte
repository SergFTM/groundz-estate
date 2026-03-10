<script lang="ts">
  import { goto } from '$app/navigation';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import DataTable from '$lib/components/cabinet/DataTable.svelte';
  import ConstructionTimeline from '$lib/components/cabinet/ConstructionTimeline.svelte';
  import { formatCurrency } from '$lib/utils/formatters';

  let { data } = $props();

  const unitColumns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'bedrooms', label: 'Bedrooms', sortable: true },
    { key: 'floor', label: 'Floor', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (v: unknown) => v != null ? formatCurrency(v as number) : '—'
    }
  ];
</script>

<svelte:head>
  <title>{data.project.name} — Projects — Admin — Develta</title>
</svelte:head>

<a href="/admin/projects" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Projects</a>

<DetailCard title={data.project.name} subtitle={data.project.location}>
  {#snippet actions()}
    <StatusBadge status={data.project.status} />
  {/snippet}

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-8);">
    <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
      <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Slug</span>
      <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);font-family:monospace;">{data.project.slug}</span>
    </div>
    <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
      <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Units</span>
      <span style="font-size:var(--text-2xl);font-family:var(--font-display);font-weight:300;font-style:italic;color:var(--color-text);">{data.project.units.length}</span>
    </div>
    <div style="background:rgba(0,0,0,0.03);border-radius:var(--radius-md);padding:var(--space-4);">
      <span style="font-size:var(--text-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Phases</span>
      <span style="font-size:var(--text-2xl);font-family:var(--font-display);font-weight:300;font-style:italic;color:var(--color-text);">{data.project.constructionPhases.length}</span>
    </div>
  </div>
</DetailCard>

{#if data.project.units.length > 0}
  <div style="margin-top:var(--space-6);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Units</h2>
    <DataTable
      columns={unitColumns}
      rows={data.project.units}
      searchable={true}
    />
  </div>
{:else}
  <div style="margin-top:var(--space-6);background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
    No units for this project yet.
  </div>
{/if}

{#if data.project.constructionPhases.length > 0}
  <div style="margin-top:var(--space-6);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Construction Timeline</h2>
    <ConstructionTimeline phases={data.project.constructionPhases} />
  </div>
{/if}
