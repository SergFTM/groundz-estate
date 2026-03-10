<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data, form } = $props();

  let showForm = $state(false);
</script>

<svelte:head>
  <title>Projects — Admin — Develta</title>
</svelte:head>

<div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Projects</h1>
    </div>
    <button
      type="button"
      class="btn btn--primary"
      onclick={() => showForm = !showForm}
    >
      {showForm ? 'Cancel' : '+ New Project'}
    </button>
  </div>

  {#if showForm}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);margin-bottom:var(--space-6);">
      <h2 style="font-size:var(--text-base);font-weight:700;color:var(--color-text);margin-bottom:var(--space-6);">New Project</h2>

      {#if form?.success}
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
          Project created successfully
        </div>
      {/if}
      {#if form?.error}
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#ef4444;">
          Please check the form fields and try again.
        </div>
      {/if}

      <form method="POST" action="?/createProject" use:enhance>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="name">Project Name</label>
            <input class="form-input" id="name" name="name" placeholder="e.g. Limassol Bay Residences" required />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="slug">Slug</label>
            <input class="form-input" id="slug" name="slug" placeholder="e.g. limassol-bay-residences" required />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="location">Location</label>
            <input class="form-input" id="location" name="location" placeholder="e.g. Limassol Marina" required />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="status">Status</label>
            <select class="form-input" id="status" name="status">
              <option value="active">Active</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn--primary">Create Project</button>
      </form>
    </div>
  {/if}

  {#if data.projects.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No projects yet. Create one above.
    </div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-4);">
      {#each data.projects as project}
        <button
          type="button"
          onclick={() => goto(`/admin/projects/${project.id}`)}
          style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-6);text-align:left;cursor:pointer;transition:box-shadow var(--transition-fast),transform var(--transition-fast);width:100%;"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
        >
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-3);">
            <h3 style="font-size:var(--text-base);font-weight:700;color:var(--color-text);">{project.name}</h3>
            <StatusBadge status={project.status} />
          </div>
          <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-2);">{project.location}</p>
          <p style="font-size:var(--text-xs);color:var(--color-text-muted);font-family:monospace;">{project.slug}</p>
          <div style="margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid rgba(0,0,0,0.06);">
            <span style="font-size:var(--text-xs);color:var(--color-text-muted);">Units: </span>
            <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{project._count.units}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
