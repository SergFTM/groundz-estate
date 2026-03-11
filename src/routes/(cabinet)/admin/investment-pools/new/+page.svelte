<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>New Investment Pool — Admin — Develta</title>
</svelte:head>

<a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Pools</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">New Investment Pool</h1>
  </div>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);">
  <form method="POST" action="?/create" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="name">Pool Name</label>
        <input class="form-input" id="name" name="name" placeholder="e.g. Marina Tower Fund" required />
        {#if formErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.name}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="projectName">Project Name</label>
        <input class="form-input" id="projectName" name="projectName" placeholder="e.g. Marina Tower" required />
        {#if formErrors.projectName}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.projectName}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="goalAmount">Goal Amount (€)</label>
        <input class="form-input" id="goalAmount" name="goalAmount" type="number" placeholder="5000000" required />
        {#if formErrors.goalAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.goalAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="raisedAmount">Raised Amount (€)</label>
        <input class="form-input" id="raisedAmount" name="raisedAmount" type="number" value="0" />
        {#if formErrors.raisedAmount}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.raisedAmount}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="targetYield">Target Yield (% p.a.)</label>
        <input class="form-input" id="targetYield" name="targetYield" type="number" step="0.1" placeholder="8" required />
        {#if formErrors.targetYield}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.targetYield}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="termMonths">Term (months)</label>
        <input class="form-input" id="termMonths" name="termMonths" type="number" placeholder="24" required />
        {#if formErrors.termMonths}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.termMonths}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="minTicket">Min Ticket (€)</label>
        <input class="form-input" id="minTicket" name="minTicket" type="number" placeholder="50000" required />
        {#if formErrors.minTicket}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.minTicket}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="status">Status</label>
        <select class="form-input" id="status" name="status">
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="imageUrl">Image URL</label>
        <input class="form-input" id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
        {#if formErrors.imageUrl}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.imageUrl}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description</label>
        <textarea class="form-input" id="description" name="description" rows="4" placeholder="Pool description…" style="resize:vertical;"></textarea>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Create Pool</button>
      <a href="/admin/investment-pools" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>
