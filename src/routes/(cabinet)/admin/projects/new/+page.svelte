<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>New Project — Admin — Develta</title>
</svelte:head>

<a
  href="/admin/projects"
  style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);"
>← Back to Projects</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">New Project</h1>
  </div>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);">
  <form method="POST" action="?/create" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="name">Project Name</label>
        <input class="form-input" id="name" name="name" placeholder="e.g. Limassol Bay Residences" required />
        {#if formErrors.name}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.name}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="slug">Slug</label>
        <input class="form-input" id="slug" name="slug" placeholder="e.g. limassol-bay-residences" required />
        {#if formErrors.slug}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.slug}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="location">Location</label>
        <input class="form-input" id="location" name="location" placeholder="e.g. Limassol Marina" required />
        {#if formErrors.location}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.location}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="status">Status</label>
        <select class="form-input" id="status" name="status">
          <option value="active">Active</option>
          <option value="coming_soon">Coming Soon</option>
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
        <textarea class="form-input" id="description" name="description" rows="4" placeholder="Project description…" style="resize:vertical;"></textarea>
        {#if formErrors.description}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.description}</p>{/if}
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Create Project</button>
      <a href="/admin/projects" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>
