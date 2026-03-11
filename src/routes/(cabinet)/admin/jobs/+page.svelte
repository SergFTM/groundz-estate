<script lang="ts">
  import { goto } from '$app/navigation';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Jobs — Admin — Develta</title>
</svelte:head>

<div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Job Positions</h1>
    </div>
    <a href="/admin/jobs/new" class="btn btn--primary">+ New Position</a>
  </div>

  {#if data.jobs.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No job positions yet. <a href="/admin/jobs/new" style="color:var(--color-accent);">Create one</a>.
    </div>
  {:else}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Title','Department','Location','Type','Active','Applications',''] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.jobs as job}
            <tr
              style="border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;"
              onclick={() => goto(`/admin/jobs/${job.id}/edit`)}
              onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'}
              onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}
            >
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{job.title}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{job.department}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{job.location}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{job.type.replace('_', ' ')}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);"><StatusBadge status={job.isActive ? 'active' : 'closed'} /></td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{job._count.applications}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">
                <a href="/admin/jobs/{job.id}/edit" style="color:var(--color-accent);text-decoration:none;font-weight:600;font-size:var(--text-xs);">Edit</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
