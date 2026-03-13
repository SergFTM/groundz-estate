<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>New Milestone — {data.pool.name} — Admin — Develta</title>
</svelte:head>

<a href="/admin/investment-pools/{data.pool.id}/edit" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to {data.pool.name}</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance · {data.pool.name}</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">New Milestone</h1>
  </div>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);">
  <form method="POST" action="?/create" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="name">Milestone Name *</label>
        <input class="form-input" id="name" name="name" placeholder="e.g. Foundation Complete" required />
        {#if formErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.name}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="status">Status</label>
        <select class="form-input" id="status" name="status">
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="completionPct">Completion % <span style="color:var(--color-text-muted);font-weight:400;">0–100</span></label>
        <input class="form-input" id="completionPct" name="completionPct" type="number" min="0" max="100" value="0" />
        {#if formErrors.completionPct}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.completionPct}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="plannedDate">Planned Date *</label>
        <input class="form-input" id="plannedDate" name="plannedDate" type="date" required />
        {#if formErrors.plannedDate}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.plannedDate}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="actualDate">Actual Date <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <input class="form-input" id="actualDate" name="actualDate" type="date" />
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <textarea class="form-input" id="description" name="description" rows="2" placeholder="Short description of this milestone…" style="resize:vertical;"></textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="notes">Internal Notes <span style="color:var(--color-text-muted);font-weight:400;">optional</span></label>
        <textarea class="form-input" id="notes" name="notes" rows="2" placeholder="Admin-only notes…" style="resize:vertical;"></textarea>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Add Milestone</button>
      <a href="/admin/investment-pools/{data.pool.id}/edit" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>
