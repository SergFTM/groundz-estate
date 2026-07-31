<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>New Job Position — Admin — Groundz</title>
</svelte:head>

<a href="/admin/jobs" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Jobs</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">New Job Position</h1>
  </div>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);">
  <form method="POST" action="?/create" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="title">Title</label>
        <input class="form-input" id="title" name="title" placeholder="e.g. Senior Frontend Developer" required />
        {#if formErrors.title}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.title}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="slug">Slug</label>
        <input class="form-input" id="slug" name="slug" placeholder="senior-frontend-developer" required />
        {#if formErrors.slug}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.slug}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="department">Department</label>
        <input class="form-input" id="department" name="department" placeholder="e.g. Engineering" required />
        {#if formErrors.department}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.department}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="location">Location</label>
        <input class="form-input" id="location" name="location" placeholder="e.g. Limassol, Cyprus" required />
        {#if formErrors.location}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.location}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="type">Type</label>
        <select class="form-input" id="type" name="type">
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="isActive" style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
          <input type="checkbox" id="isActive" name="isActive" checked style="width:auto;" />
          Active (visible on site)
        </label>
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description (HTML)</label>
        <textarea class="form-input" id="description" name="description" rows="10" placeholder="<h3>Responsibilities</h3><ul><li>...</li></ul>" style="resize:vertical;font-family:monospace;font-size:var(--text-sm);" required></textarea>
        {#if formErrors.description}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.description}</p>{/if}
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Create Position</button>
      <a href="/admin/jobs" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>
