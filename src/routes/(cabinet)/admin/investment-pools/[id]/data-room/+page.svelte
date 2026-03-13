<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { formatDate } from '$lib/utils/formatters';

  let { data, form } = $props();

  const CATEGORY_LABEL: Record<string, { label: string; icon: string }> = {
    floor_plan:              { label: 'Floor Plan',             icon: '📐' },
    subscription_agreement:  { label: 'Subscription Agreement', icon: '📋' },
    contract:                { label: 'Contract',               icon: '📄' },
    kyc:                     { label: 'KYC',                    icon: '✅' },
    other:                   { label: 'Other',                  icon: '📁' },
  };

  function fmtSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1024)      return `${(bytes / 1024).toFixed(0)} KB`;
    return bytes > 0 ? `${bytes} B` : '—';
  }

  // Group documents by category
  let grouped = $derived.by(() => {
    const map = new Map<string, typeof data.documents>();
    for (const doc of data.documents) {
      if (!map.has(doc.category)) map.set(doc.category, []);
      map.get(doc.category)!.push(doc);
    }
    return map;
  });
</script>

<svelte:head><title>Data Room — {data.pool.name}</title></svelte:head>

<div style="max-width:900px;">
  <div style="margin-bottom:var(--space-2);">
    <a href="/admin/investment-pools/{data.pool.id}/edit" style="font-size:var(--text-xs);color:var(--color-text-muted);text-decoration:none;">← {data.pool.name}</a>
  </div>
  <div style="margin-bottom:var(--space-6);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-4);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">INVESTMENT POOL</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Data Room</h1>
    </div>
    <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);text-align:right;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);">Investor Access</p>
      <p style="font-size:var(--text-xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">{data.investorCount}</p>
    </div>
  </div>

  <!-- Document list grouped by category -->
  {#if data.documents.length > 0}
    <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-bottom:var(--space-6);">
      {#each [...grouped.entries()] as [cat, docs]}
        {@const meta = CATEGORY_LABEL[cat] ?? { label: cat, icon: '📁' }}
        <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
          <div style="padding:var(--space-3) var(--space-5);border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;gap:var(--space-2);">
            <span>{meta.icon}</span>
            <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{meta.label}</p>
            <span style="font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);">{docs.length}</span>
          </div>
          {#each docs as doc, i}
            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-3) var(--space-5);{i < docs.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.04);' : ''}">
              <div style="flex:1;min-width:0;">
                <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{doc.name}</p>
                <p style="font-size:10px;color:var(--color-text-muted);margin-top:2px;">
                  {fmtSize(doc.fileSize)} · Added {formatDate(doc.uploadedAt)}
                  {#if doc.user && doc.user.name}· by {doc.user.name}{/if}
                </p>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-3);flex-shrink:0;">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style="font-size:var(--text-xs);font-weight:600;color:var(--color-accent);text-decoration:none;">Download</a>
                <form method="POST" action="?/delete" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
                  <input type="hidden" name="id" value={doc.id} />
                  <button
                    type="submit"
                    onclick={e => { if (!confirm('Delete this document?')) e.preventDefault(); }}
                    style="font-size:var(--text-xs);font-weight:700;color:#ef4444;background:none;border:none;cursor:pointer;"
                  >Delete</button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-12);text-align:center;margin-bottom:var(--space-6);">
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);">No documents in this data room yet. Upload the first document below.</p>
    </div>
  {/if}

  <!-- Upload form -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-5);">Add Document</p>

    {#if form?.error}
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#ef4444;">{form.error}</div>
    {/if}
    {#if form?.success}
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">Document added to data room.</div>
    {/if}

    <form
      method="POST"
      action="?/upload"
      use:enhance={() => async ({ update, formElement }) => {
        await update();
        await invalidateAll();
        if (!form?.error) formElement.reset();
      }}
    >
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">
        <div>
          <label class="form-label" for="name">Document Name</label>
          <input class="form-input" id="name" name="name" type="text" placeholder="e.g. Subscription Agreement v2.pdf" required />
        </div>
        <div>
          <label class="form-label" for="category">Category</label>
          <select class="form-input" id="category" name="category" required>
            {#each Object.entries(CATEGORY_LABEL) as [val, meta]}
              <option value={val}>{meta.icon} {meta.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="form-label" for="fileUrl">File URL</label>
          <input class="form-input" id="fileUrl" name="fileUrl" type="url" placeholder="https://…" required />
        </div>
        <div>
          <label class="form-label" for="fileSize">File Size (bytes)</label>
          <input class="form-input" id="fileSize" name="fileSize" type="number" min="0" placeholder="e.g. 1048576" />
        </div>
      </div>
      <button type="submit" class="btn btn--primary">Add to Data Room</button>
    </form>
  </div>
</div>
