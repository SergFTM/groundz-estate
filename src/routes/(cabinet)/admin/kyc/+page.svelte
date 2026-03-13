<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { formatDate } from '$lib/utils/formatters';

  let { data } = $props();

  let filter = $state<'all' | 'pending' | 'approved' | 'action_required'>('pending');
  let expanded = $state<Set<string>>(new Set());

  let rows = $derived(
    filter === 'all' ? data.rows : data.rows.filter(r => r.overallStatus === filter)
  );

  function toggle(id: string) {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    expanded = next;
  }

  const CATEGORY_LABEL: Record<string, string> = {
    passport:       'Passport / ID',
    kyc:            'KYC Form',
    proof_of_funds: 'Proof of Funds',
  };

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    approved:        { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', label: 'Approved' },
    pending:         { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pending' },
    action_required: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Action Required' },
  };

  function fmtSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
</script>

<svelte:head><title>KYC Review — Admin</title></svelte:head>

<div style="max-width:1000px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">KYC Review</h1>
  </div>

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-6);">
    {#each [
      { label: 'Investors w/ Docs', value: String(data.kpis.total) },
      { label: 'Pending Review',    value: String(data.kpis.pending),  color: '#f59e0b' },
      { label: 'Approved',          value: String(data.kpis.approved), color: '#22c55e' },
      { label: 'Action Required',   value: String(data.kpis.rejected), color: '#ef4444' },
    ] as kpi}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{kpi.label}</p>
        <p style="font-size:var(--text-xl);font-weight:700;color:{kpi.color ?? 'var(--color-text)'};margin-top:var(--space-2);">{kpi.value}</p>
      </div>
    {/each}
  </div>

  <!-- Filter tabs -->
  <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-5);">
    {#each ([['all','All'],['pending','Pending'],['approved','Approved'],['action_required','Action Required']] as const) as [val, label]}
      <button
        onclick={() => filter = val}
        style="font-size:var(--text-xs);font-weight:700;padding:var(--space-1) var(--space-3);border-radius:var(--radius-md);border:1px solid {filter === val ? 'var(--color-accent)' : 'rgba(0,0,0,0.12)'};background:{filter === val ? 'var(--color-accent)' : 'transparent'};color:{filter === val ? '#fff' : 'var(--color-text-muted)'};cursor:pointer;"
      >{label}</button>
    {/each}
  </div>

  <!-- Investor cards -->
  {#if rows.length === 0}
    <p style="text-align:center;padding:var(--space-12);font-size:var(--text-sm);color:var(--color-text-muted);">No investors found for this filter.</p>
  {:else}
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      {#each rows as row}
        {@const overall = STATUS_STYLE[row.overallStatus]}
        <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">

          <!-- Header row -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-4) var(--space-5);cursor:pointer;" onclick={() => toggle(row.id)}>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:var(--space-3);">
                <a href="/admin/users/{row.id}" onclick={e => e.stopPropagation()} style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);text-decoration:none;">{row.name ?? '—'}</a>
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{row.email}</span>
              </div>
              <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">{row.docs.length} document{row.docs.length !== 1 ? 's' : ''}</p>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-4);flex-shrink:0;">
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:{overall.bg};color:{overall.color};">{overall.label}</span>

              {#if row.overallStatus !== 'approved'}
                <form method="POST" action="?/approveAll" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
                  <input type="hidden" name="userId" value={row.id} />
                  <button type="submit" onclick={e => e.stopPropagation()} style="font-size:var(--text-xs);font-weight:700;padding:var(--space-1) var(--space-3);border-radius:var(--radius-md);border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08);color:#22c55e;cursor:pointer;">Approve All</button>
                </form>
              {/if}

              <span style="font-size:var(--text-xs);color:var(--color-text-muted);user-select:none;">{expanded.has(row.id) ? '▲' : '▼'}</span>
            </div>
          </div>

          <!-- Documents list (expandable) -->
          {#if expanded.has(row.id)}
            <div style="border-top:1px solid rgba(0,0,0,0.06);">
              {#each row.docs as doc, i}
                {@const st = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending}
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-3) var(--space-5);{i < row.docs.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.04);' : ''}background:rgba(0,0,0,0.01);">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;">
                      <span style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-accent);">{CATEGORY_LABEL[doc.category] ?? doc.category}</span>
                      <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{doc.name}</span>
                      {#if doc.poolName}
                        <span style="font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);">{doc.poolName}</span>
                      {/if}
                    </div>
                    <p style="font-size:10px;color:var(--color-text-muted);margin-top:2px;">{fmtSize(doc.fileSize)} · Uploaded {formatDate(doc.uploadedAt)}</p>
                  </div>
                  <div style="display:flex;align-items:center;gap:var(--space-3);flex-shrink:0;">
                    <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:{st.bg};color:{st.color};">{st.label}</span>

                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style="font-size:var(--text-xs);font-weight:600;color:var(--color-accent);text-decoration:none;">View</a>

                    {#if doc.status !== 'approved'}
                      <form method="POST" action="?/approve" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="userId" value={row.id} />
                        <button type="submit" style="font-size:var(--text-xs);font-weight:700;border:none;background:none;color:#22c55e;cursor:pointer;">✓ Approve</button>
                      </form>
                    {/if}

                    {#if doc.status !== 'action_required'}
                      <form method="POST" action="?/reject" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="userId" value={row.id} />
                        <button type="submit" style="font-size:var(--text-xs);font-weight:700;border:none;background:none;color:#ef4444;cursor:pointer;">✗ Reject</button>
                      </form>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}

        </div>
      {/each}
    </div>
  {/if}
</div>
