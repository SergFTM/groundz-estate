<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import { formatDate } from '$lib/utils/formatters';

  let { data, form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>Edit {data.job.title} — Admin — Develta</title>
</svelte:head>

<a href="/admin/jobs" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Jobs</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Edit Job Position</h1>
  </div>
</div>

{#if form?.success}
  <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
    Position updated successfully.
  </div>
{/if}

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);margin-bottom:var(--space-6);">
  <form method="POST" action="?/update" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="title">Title</label>
        <input class="form-input" id="title" name="title" value={data.job.title} required />
        {#if formErrors.title}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.title}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="slug">Slug</label>
        <input class="form-input" id="slug" name="slug" value={data.job.slug} required />
        {#if formErrors.slug}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.slug}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="department">Department</label>
        <input class="form-input" id="department" name="department" value={data.job.department} required />
        {#if formErrors.department}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.department}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="location">Location</label>
        <input class="form-input" id="location" name="location" value={data.job.location} required />
        {#if formErrors.location}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.location}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="type">Type</label>
        <select class="form-input" id="type" name="type">
          {#each [['full_time','Full Time'],['part_time','Part Time'],['contract','Contract']] as [val, lbl]}
            <option value={val} selected={data.job.type === val}>{lbl}</option>
          {/each}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="isActive" style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;">
          <input type="checkbox" id="isActive" name="isActive" checked={data.job.isActive} style="width:auto;" />
          Active (visible on site)
        </label>
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="description">Description (HTML)</label>
        <textarea class="form-input" id="description" name="description" rows="10" style="resize:vertical;font-family:monospace;font-size:var(--text-sm);" required>{data.job.description}</textarea>
        {#if formErrors.description}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.description}</p>{/if}
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Save Changes</button>
      <a href="/admin/jobs" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>

<!-- Applications section -->
<div style="margin-bottom:var(--space-6);">
  <h2 style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-4);">Applications ({data.job.applications.length})</h2>

  {#if data.job.applications.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No applications yet.
    </div>
  {:else}
    <div style="display:grid;gap:var(--space-4);">
      {#each data.job.applications as app}
        <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3);">
            <div>
              <h3 style="font-size:var(--text-base);font-weight:700;color:var(--color-text);margin-bottom:var(--space-1);">{app.name}</h3>
              <p style="font-size:var(--text-sm);color:var(--color-text-muted);">{app.email}</p>
            </div>
            <div style="display:flex;gap:var(--space-3);align-items:center;">
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{formatDate(app.createdAt)}</span>
              <form
                method="POST"
                action="?/deleteApplication"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update();
                    await invalidateAll();
                  };
                }}
              >
                <input type="hidden" name="applicationId" value={app.id} />
                <button
                  type="submit"
                  style="background:none;border:none;color:#ef4444;font-size:var(--text-xs);cursor:pointer;font-weight:600;padding:0;"
                  onclick={(e) => { if (!confirm('Delete this application?')) e.preventDefault(); }}
                >Delete</button>
              </form>
            </div>
          </div>
          {#if app.linkedinUrl}
            <p style="font-size:var(--text-sm);margin-bottom:var(--space-2);"><strong>LinkedIn:</strong> <a href={app.linkedinUrl} target="_blank" rel="noopener" style="color:var(--color-accent);">{app.linkedinUrl}</a></p>
          {/if}
          {#if app.coverLetter}
            <div style="background:rgba(0,0,0,0.02);border-radius:var(--radius-md);padding:var(--space-4);margin-top:var(--space-3);">
              <span style="font-size:var(--text-xs);font-weight:700;color:var(--color-text-muted);display:block;margin-bottom:var(--space-2);">Cover Letter</span>
              <p style="font-size:var(--text-sm);color:var(--color-text);white-space:pre-wrap;">{app.coverLetter}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(239,68,68,0.12);border-radius:var(--radius-lg);padding:var(--space-8);">
  <h2 style="font-size:var(--text-base);font-weight:700;color:#ef4444;margin-bottom:var(--space-2);">Danger Zone</h2>
  <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">Permanently delete this position and all its applications. This cannot be undone.</p>
  <form method="POST" action="?/delete" use:enhance>
    <button
      type="submit"
      style="background:#ef4444;color:white;border:none;border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);font-size:var(--text-sm);font-weight:600;cursor:pointer;"
      onclick={(e) => { if (!confirm('Delete this position and all applications? This cannot be undone.')) e.preventDefault(); }}
    >Delete Position</button>
  </form>
</div>
