<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { formatDate } from '$lib/utils/formatters';

  let { data, form } = $props();

  function fmt(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
    return `€${n}`;
  }
</script>

<svelte:head><title>Construction Reports — {data.pool.name}</title></svelte:head>

<div style="max-width:900px;">
  <div style="margin-bottom:var(--space-2);">
    <a href="/admin/investment-pools/{data.pool.id}/edit" style="font-size:var(--text-xs);color:var(--color-text-muted);text-decoration:none;">← {data.pool.name}</a>
  </div>
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CONSTRUCTION</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Construction Reports</h1>
  </div>

  <!-- Report history -->
  {#if data.reports.length > 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-6);">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
              {#each ['Date','Completion','Budget','Spent','Variance','Notes',''] as col}
                <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each data.reports as r}
              {@const varPct = r.budgetTotal > 0 ? ((r.budgetSpent - r.budgetTotal) / r.budgetTotal) * 100 : 0}
              <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);white-space:nowrap;">{formatDate(r.reportDate)}</td>
                <td style="padding:var(--space-3) var(--space-4);">
                  <div style="display:flex;align-items:center;gap:var(--space-2);">
                    <div style="width:60px;height:5px;background:rgba(0,0,0,0.07);border-radius:3px;overflow:hidden;">
                      <div style="height:100%;width:{r.overallPct}%;background:var(--color-accent);"></div>
                    </div>
                    <span style="font-size:var(--text-sm);font-weight:700;">{r.overallPct}%</span>
                  </div>
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{fmt(r.budgetTotal)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{fmt(r.budgetSpent)}</td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:700;color:{varPct > 5 ? '#ef4444' : varPct > 0 ? '#f59e0b' : '#22c55e'};">
                  {varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%
                </td>
                <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-xs);color:var(--color-text-muted);max-width:200px;">{r.notes ?? '—'}</td>
                <td style="padding:var(--space-3) var(--space-4);">
                  <form method="POST" action="?/delete" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" style="font-size:var(--text-xs);color:#ef4444;background:none;border:none;cursor:pointer;font-weight:700;"
                      onclick={e => { if (!confirm('Delete this report?')) e.preventDefault(); }}>Delete</button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Add new report -->
  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-5);">Add Construction Report</p>

    {#if form?.error}
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#ef4444;">{form.error}</div>
    {/if}
    {#if form?.success}
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">Report saved.</div>
    {/if}

    <form method="POST" action="?/create" use:enhance={() => async ({ update, formElement }) => { await update(); await invalidateAll(); if (!form?.error) formElement.reset(); }}>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">
        <div>
          <label class="form-label" for="reportDate">Report Date</label>
          <input class="form-input" id="reportDate" name="reportDate" type="date" required />
        </div>
        <div>
          <label class="form-label" for="overallPct">Overall Completion (%)</label>
          <input class="form-input" id="overallPct" name="overallPct" type="number" min="0" max="100" placeholder="0–100" required />
        </div>
        <div></div>
        <div>
          <label class="form-label" for="budgetTotal">Budget Total (€)</label>
          <input class="form-input" id="budgetTotal" name="budgetTotal" type="number" min="0" step="1000" placeholder="e.g. 2500000" required />
        </div>
        <div>
          <label class="form-label" for="budgetSpent">Budget Spent (€)</label>
          <input class="form-input" id="budgetSpent" name="budgetSpent" type="number" min="0" step="1000" placeholder="e.g. 1200000" required />
        </div>
        <div>
          <label class="form-label" for="notes">Notes</label>
          <input class="form-input" id="notes" name="notes" placeholder="Site update, delays, etc." />
        </div>
      </div>
      <button type="submit" class="btn btn--primary">Save Report</button>
    </form>
  </div>
</div>
