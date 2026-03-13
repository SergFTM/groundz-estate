<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';

  let { data, form } = $props();
  const { myPools } = data;

  let formResult = $derived(form as { uploadSuccess?: boolean; error?: string } | null);

  // Group documents: by pool, then a "General" bucket
  type Doc = typeof data.documents[number];

  let grouped = $derived.by(() => {
    const poolMap = new Map<string, { poolName: string; docs: Doc[] }>();
    const general: Doc[] = [];

    for (const doc of data.documents) {
      if (doc.poolId && doc.pool) {
        if (!poolMap.has(doc.poolId)) {
          poolMap.set(doc.poolId, { poolName: doc.pool.name, docs: [] });
        }
        poolMap.get(doc.poolId)!.docs.push(doc);
      } else {
        general.push(doc);
      }
    }

    const sections: { label: string; docs: Doc[] }[] = [];
    for (const [, v] of poolMap) {
      sections.push({ label: v.poolName, docs: v.docs });
    }
    if (general.length > 0) {
      sections.push({ label: 'General', docs: general });
    }
    return sections;
  });

  const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
    contract:               { label: 'Contract',              icon: '📄', color: '#6366f1' },
    passport:               { label: 'Passport / ID',         icon: '🪪', color: '#0ea5e9' },
    tax:                    { label: 'Tax Document',           icon: '🧾', color: '#f59e0b' },
    proof_of_funds:         { label: 'Proof of Funds',        icon: '💰', color: '#22c55e' },
    kyc:                    { label: 'KYC',                   icon: '✅', color: '#8b5cf6' },
    floor_plan:             { label: 'Floor Plan',            icon: '🏗️', color: '#d4a944' },
    subscription_agreement: { label: 'Subscription Agr.',    icon: '✍️', color: '#ec4899' },
    other:                  { label: 'Other',                 icon: '📎', color: '#9ca3af' },
  };

  function catMeta(cat: string) {
    return CATEGORY_META[cat] ?? { label: cat, icon: '📎', color: '#9ca3af' };
  }

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    approved:        { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e', label: 'Approved' },
    pending:         { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', label: 'Pending Review' },
    action_required: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', label: 'Action Required' },
  };

  function statusStyle(s: string) {
    return STATUS_STYLE[s] ?? { bg: 'rgba(120,120,120,0.1)', color: '#787878', label: s };
  }
</script>

<svelte:head>
  <title>Documents — Develta</title>
</svelte:head>

<div style="max-width:1000px;display:flex;flex-direction:column;gap:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">INVESTOR</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Documents</h1>
  </div>

  <!-- Document groups -->
  {#if data.documents.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-10);text-align:center;">
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);">No documents uploaded yet.</p>
    </div>
  {:else}
    {#each grouped as section}
      <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
        <div style="padding:var(--space-4) var(--space-6);border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:space-between;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{section.label}</p>
          <p style="font-size:var(--text-xs);color:var(--color-text-muted);">{section.docs.length} file{section.docs.length !== 1 ? 's' : ''}</p>
        </div>
        <div style="display:flex;flex-direction:column;">
          {#each section.docs as doc, i}
            {@const cm = catMeta(doc.category)}
            {@const ss = statusStyle(doc.status)}
            <div style="display:flex;align-items:center;gap:var(--space-4);padding:var(--space-3) var(--space-6);{i < section.docs.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.04);' : ''}">
              <!-- Category icon -->
              <div style="width:34px;height:34px;border-radius:var(--radius-md);background:{cm.color}1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;">
                {cm.icon}
              </div>
              <!-- Name + category -->
              <div style="flex:1;min-width:0;">
                <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{doc.name}</p>
                <p style="font-size:var(--text-xs);color:{cm.color};margin-top:1px;">{cm.label}</p>
              </div>
              <!-- Status badge -->
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;white-space:nowrap;background:{ss.bg};color:{ss.color};flex-shrink:0;">
                {ss.label}
              </span>
              <!-- Date -->
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);flex-shrink:0;min-width:72px;text-align:right;">
                {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}
              </span>
              <!-- Download -->
              <a
                href={doc.fileUrl}
                download
                style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);text-decoration:none;flex-shrink:0;padding:var(--space-1) var(--space-3);background:rgba(212,169,68,0.08);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-md);transition:opacity 0.15s;"
              >
                Download
              </a>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}

  <!-- Upload form -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Upload Document</p>

    {#if formResult?.uploadSuccess}
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
        Document submitted for review.
      </div>
    {/if}
    {#if formResult?.error}
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#ef4444;">
        {formResult.error}
      </div>
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">
        <div>
          <label class="form-label" for="docName">Document Name</label>
          <input class="form-input" id="docName" name="name" placeholder="e.g. Proof of funds" required />
        </div>
        <div>
          <label class="form-label" for="docCategory">Category</label>
          <select class="form-input" id="docCategory" name="category">
            {#each Object.entries(CATEGORY_META) as [val, meta]}
              <option value={val}>{meta.icon} {meta.label}</option>
            {/each}
          </select>
        </div>
        {#if myPools.length > 0}
          <div style="grid-column:1/-1;">
            <label class="form-label" for="docPool">Link to Investment Pool (optional)</label>
            <select class="form-input" id="docPool" name="poolId">
              <option value="">— General document —</option>
              {#each myPools as pool}
                <option value={pool.id}>{pool.name}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>
      <button type="submit" class="btn btn--primary">Submit Document</button>
    </form>
  </div>
</div>
