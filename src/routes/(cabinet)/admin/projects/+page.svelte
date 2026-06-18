<script lang="ts">
  import { goto } from '$app/navigation';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Projects — Admin — Groundz</title>
</svelte:head>

<div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CRM</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Projects</h1>
    </div>
    <a href="/admin/projects/new" class="btn btn--primary">+ New Project</a>
  </div>

  {#if data.projects.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No projects yet. <a href="/admin/projects/new" style="color:var(--color-accent);">Create one</a>.
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
