<script lang="ts">
  import { enhance } from '$app/forms';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Documents — Admin — Develta</title>
</svelte:head>

<div>
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Finance</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Documents</h1>
  </div>

  <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
    {#if data.documents.length === 0}
      <div style="padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
        No documents uploaded yet.
      </div>
    {:else}
      {#each data.documents as doc, i}
        <div
          style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);padding:var(--space-4) var(--space-6);{i < data.documents.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.05);' : ''}"
        >
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-1);">
              <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);">{doc.user?.name || doc.user?.email || 'Unknown User'}</span>
              {#if doc.user?.name && doc.user?.email}
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{doc.user.email}</span>
              {/if}
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-4);">
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">{doc.type}</span>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{new Date(doc.uploadedAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:var(--space-3);flex-shrink:0;">
            <StatusBadge status={doc.status} />

            <form method="POST" action="?/approveDocument" use:enhance>
              <input type="hidden" name="id" value={doc.id} />
              <button
                type="submit"
                style="padding:var(--space-2) var(--space-3);font-family:var(--font-body);font-size:var(--text-xs);font-weight:700;border:1px solid rgba(34,197,94,0.3);border-radius:var(--radius-sm);background:rgba(34,197,94,0.08);color:#22c55e;cursor:pointer;transition:all var(--transition-fast);"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.15)'; }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.08)'; }}
              >
                Approve
              </button>
            </form>

            <form method="POST" action="?/rejectDocument" use:enhance>
              <input type="hidden" name="id" value={doc.id} />
              <button
                type="submit"
                style="padding:var(--space-2) var(--space-3);font-family:var(--font-body);font-size:var(--text-xs);font-weight:700;border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);background:rgba(239,68,68,0.08);color:#ef4444;cursor:pointer;transition:all var(--transition-fast);"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
              >
                Reject
              </button>
            </form>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
