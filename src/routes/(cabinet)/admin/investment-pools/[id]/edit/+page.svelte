<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';

  let { data, form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>Edit {data.pool.name} — Admin — Develta</title>
</svelte:head>

<a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Pools</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Edit Investment Pool</h1>
  </div>
</div>

{#if form?.success}
  <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
    Pool updated successfully.
  </div>
{/if}

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);margin-bottom:var(--space-6);">
  <form method="POST" action="?/update" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="name">Pool Name</label>
        <input class="form-input" id="name" name="name" value={data.pool.name} required />
        {#if formErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.name}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="projectName">Project Name</label>
        <input class="form-input" id="projectName" name="projectName" value={data.pool.projectName} required />
        {#if formErrors.projectName}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.projectName}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="goalAmount">Goal Amount (€)</label>
        <input class="form-input" id="goalAmount" name="goalAmount" type="number" value={data.pool.goalAmount} required />
        {#if formErrors.goalAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.goalAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="raisedAmount">Raised Amount (€)</label>
        <input class="form-input" id="raisedAmount" name="raisedAmount" type="number" value={data.pool.raisedAmount} />
        {#if formErrors.raisedAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.raisedAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="targetYield">Target Yield (% p.a.)</label>
        <input class="form-input" id="targetYield" name="targetYield" type="number" step="0.1" value={data.pool.targetYield} required />
        {#if formErrors.targetYield}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.targetYield}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="termMonths">Term (months)</label>
        <input class="form-input" id="termMonths" name="termMonths" type="number" value={data.pool.termMonths} required />
        {#if formErrors.termMonths}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.termMonths}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="minTicket">Min Ticket (€)</label>
        <input class="form-input" id="minTicket" name="minTicket" type="number" value={data.pool.minTicket} required />
        {#if formErrors.minTicket}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.minTicket}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="status">Status</label>
        <select class="form-input" id="status" name="status">
          {#each [['active','Active'],['closed','Closed'],['completed','Completed']] as [val, lbl]}
            <option value={val} selected={data.pool.status === val}>{lbl}</option>
          {/each}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="imageUrl">Image URL</label>
        <input class="form-input" id="imageUrl" name="imageUrl" type="url" value={data.pool.imageUrl ?? ''} placeholder="https://..." />
        {#if formErrors.imageUrl}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.imageUrl}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description</label>
        <textarea class="form-input" id="description" name="description" rows="4" style="resize:vertical;">{data.pool.description ?? ''}</textarea>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Save Changes</button>
      <a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>

<!-- Investors section -->
{#if data.pool.investments.length > 0}
  <div style="margin-bottom:var(--space-6);">
    <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Investors ({data.pool.investments.length})</h2>
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Investor','Email','Amount','Date'] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.pool.investments as inv}
            <tr style="border-bottom:1px solid rgba(0,0,0,0.04);">
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{inv.user.name}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);color:var(--color-text-muted);">{inv.user.email}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{formatCurrency(inv.amount)}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{formatDate(inv.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(239,68,68,0.12);border-radius:var(--radius-lg);padding:var(--space-8);">
  <h2 style="font-size:var(--text-base);font-weight:700;color:#ef4444;margin-bottom:var(--space-2);">Danger Zone</h2>
  <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">Permanently delete this pool. This cannot be undone.</p>
  <form method="POST" action="?/delete" use:enhance>
    <button
      type="submit"
      style="background:#ef4444;color:white;border:none;border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);font-size:var(--text-sm);font-weight:600;cursor:pointer;"
      onclick={(e) => { if (!confirm('Delete this investment pool? This cannot be undone.')) e.preventDefault(); }}
    >Delete Pool</button>
  </form>
</div>
