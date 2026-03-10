<script lang="ts">
  import DataTable from '$lib/components/cabinet/DataTable.svelte';

  let { data } = $props();

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, { bg: string; color: string }> = {
          approved: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
          pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
          action_required: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
        };
        const v = variants[status] ?? { bg: 'rgba(120,120,120,0.1)', color: '#787878' };
        const label = status.replace(/_/g, ' ');
        return `<span style="display:inline-flex;align-items:center;padding:3px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;border-radius:999px;white-space:nowrap;background:${v.bg};color:${v.color}">${label}</span>`;
      }
    },
    {
      key: 'uploadedAt',
      label: 'Upload Date',
      sortable: true,
      render: (value: unknown) => new Date(value as string).toLocaleDateString('en-GB')
    }
  ];

  let rows = $derived(data.documents.map(d => ({
    name: d.name,
    category: d.category,
    status: d.status,
    uploadedAt: d.uploadedAt
  })));
</script>

<div class="documents-page">
  <h1 class="page-title">Documents</h1>

  <DataTable {columns} {rows} searchable={true} />
</div>

<style>
  .documents-page {
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
