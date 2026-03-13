<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';

  let { data, form } = $props();

  type Commit = typeof data.commits[number];
  let editing = $state<string | null>(null);
  let editStatus = $state('');
  let editNotes = $state('');

  function startEdit(c: Commit) {
    editing = c.id;
    editStatus = c.status;
    editNotes = c.notes ?? '';
  }

  function cancelEdit() { editing = null; }

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    soft_commit: { bg: 'rgba(212,169,68,0.1)',  color: '#d4a944' },
    pending:     { bg: 'rgba(234,179,8,0.1)',   color: '#ca8a04' },
    funded:      { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e' },
    cancelled:   { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  };

  const TOTALS = $derived({
    total:     data.commits.reduce((s, c) => s + c.amount, 0),
    funded:    data.commits.filter(c => c.status === 'funded').reduce((s, c) => s + c.amount, 0),
    pending:   data.commits.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0),
    softCount: data.commits.filter(c => c.status === 'soft_commit').length,
  });
</script>

<svelte:head><title>Commits — Admin</title></svelte:head>

<div style="max-width:1100px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">FINANCE</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Investor Commits</h1>
  </div>

  <!-- KPI strip -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-6);">
    {#each [
      { label: 'Total Committed',  value: formatCurrency(TOTALS.total) },
      { label: 'Funded',           value: formatCurrency(TOTALS.funded),  accent: true },
      { label: 'Pending',          value: formatCurrency(TOTALS.pending) },
      { label: 'Soft Commits',     value: String(TOTALS.softCount) + ' deals' },
    ] as kpi}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-5);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{kpi.label}</p>
        <p style="font-size:var(--text-xl);font-weight:700;color:{kpi.accent ? 'var(--color-accent)' : 'var(--color-text)'};margin-top:var(--space-2);">{kpi.value}</p>
      </div>
    {/each}
  </div>

  {#if form?.error}
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#ef4444;">{form.error}</div>
  {/if}

  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:800px;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Investor','Pool','Amount','Status','Notes','Date',''] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.commits as c}
            {@const ss = STATUS_STYLE[c.status] ?? STATUS_STYLE.soft_commit}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);">
                <p style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{c.user.name ?? '—'}</p>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);">{c.user.email}</p>
              </td>
              <td style="padding:var(--space-3) var(--space-4);">
                <a href="/admin/investment-pools/{c.pool.id}/edit" style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);text-decoration:none;">{c.pool.name}</a>
              </td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{formatCurrency(c.amount)}</td>
              <td style="padding:var(--space-3) var(--space-4);">
                {#if editing === c.id}
                  <select
                    bind:value={editStatus}
                    style="font-size:var(--text-xs);padding:var(--space-1) var(--space-2);border:1px solid rgba(0,0,0,0.15);border-radius:var(--radius-sm);"
                  >
                    {#each ['soft_commit','pending','funded','cancelled'] as s}
                      <option value={s}>{s.replace('_', ' ')}</option>
                    {/each}
                  </select>
                {:else}
                  <span style="font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:{ss.bg};color:{ss.color};">
                    {c.status.replace('_', ' ')}
                  </span>
                {/if}
              </td>
              <td style="padding:var(--space-3) var(--space-4);max-width:200px;">
                {#if editing === c.id}
                  <input
                    type="text"
                    bind:value={editNotes}
                    placeholder="Notes…"
                    style="width:100%;font-size:var(--text-xs);padding:var(--space-1) var(--space-2);border:1px solid rgba(0,0,0,0.15);border-radius:var(--radius-sm);"
                  />
                {:else}
                  <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{c.notes ?? '—'}</span>
                {/if}
              </td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);white-space:nowrap;">{formatDate(c.createdAt)}</td>
              <td style="padding:var(--space-3) var(--space-4);white-space:nowrap;">
                {#if editing === c.id}
                  <form
                    method="POST" action="?/update"
                    use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); editing = null; }}
                    style="display:inline-flex;gap:var(--space-2);"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value={editStatus} />
                    <input type="hidden" name="notes" value={editNotes} />
                    <button type="submit" style="font-size:var(--text-xs);font-weight:700;color:#fff;background:#22c55e;border:none;border-radius:var(--radius-sm);padding:var(--space-1) var(--space-3);cursor:pointer;">Save</button>
                    <button type="button" onclick={cancelEdit} style="font-size:var(--text-xs);font-weight:700;color:var(--color-text-muted);background:rgba(0,0,0,0.06);border:none;border-radius:var(--radius-sm);padding:var(--space-1) var(--space-3);cursor:pointer;">Cancel</button>
                  </form>
                {:else}
                  <button
                    onclick={() => startEdit(c)}
                    style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);background:rgba(212,169,68,0.08);border:1px solid rgba(212,169,68,0.2);border-radius:var(--radius-sm);padding:var(--space-1) var(--space-3);cursor:pointer;"
                  >
                    Edit
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if data.commits.length === 0}
      <p style="padding:var(--space-8);text-align:center;font-size:var(--text-sm);color:var(--color-text-muted);">No investor commits yet.</p>
    {/if}
  </div>
</div>
