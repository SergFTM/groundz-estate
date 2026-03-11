<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import DataTable from '$lib/components/cabinet/DataTable.svelte';

  let { data, form } = $props();

  let formResult = $derived(form as { uploadSuccess?: boolean; error?: string } | null);

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

  let rows = $derived(data.documents.map((d) => ({
    name: d.name,
    category: d.category,
    status: d.status,
    uploadedAt: d.uploadedAt
  })));
</script>

<svelte:head>
  <title>Documents — Develta</title>
</svelte:head>

<div class="documents-page">
  <div class="documents-page__header">
    <span class="documents-page__label">INVESTOR</span>
    <h1 class="documents-page__title">Documents</h1>
  </div>

  <DataTable {columns} {rows} searchable={true} />

  <!-- Upload form -->
  <div class="upload-section">
    <h2 class="upload-title">Upload Document</h2>

    {#if formResult?.uploadSuccess}
      <div class="success-msg">Document submitted for review.</div>
    {/if}
    {#if formResult?.error}
      <div class="error-msg">{formResult.error}</div>
    {/if}

    <form
      method="POST"
      action="?/upload"
      use:enhance={({ formElement }) => {
        return async ({ update, result }) => {
          await update();
          await invalidateAll();
          if (result.type === 'success') formElement.reset();
        };
      }}
    >
      <div class="upload-fields">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="docName">Document Name</label>
          <input class="form-input" id="docName" name="name" placeholder="e.g. Proof of funds" required />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="docCategory">Category</label>
          <select class="form-input" id="docCategory" name="category">
            <option value="passport">Passport</option>
            <option value="contract">Contract</option>
            <option value="tax">Tax</option>
            <option value="proof_of_funds">Proof of Funds</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn--primary" style="margin-top:var(--space-4);">Submit Document</button>
    </form>
  </div>
</div>

<style>
  .documents-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1000px;
  }

  .documents-page__label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .documents-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-top: var(--space-1);
  }

  .upload-section {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .upload-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: var(--space-4);
  }

  .upload-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
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
    .upload-fields {
      grid-template-columns: 1fr;
    }
  }
</style>
