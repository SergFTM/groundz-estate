<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();

  type Comment = typeof data.comments[0];
  type Verdict = { commentId: string; verdict: 'ok' | 'flag'; reason: string; category: string };

  let comments = $state<Comment[]>(data.comments);
  let search = $state('');
  let verdicts = $state<Record<string, Verdict>>({});
  let aiChecking = $state(false);
  let aiChecked = $state(false);
  let aiError = $state<string | null>(null);
  let autoMod = $state(false);
  let autoModSaving = $state(false);

  let filtered = $derived(
    !search ? comments : comments.filter(c =>
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.user.name ?? c.user.email).toLowerCase().includes(search.toLowerCase()) ||
      c.article.title.toLowerCase().includes(search.toLowerCase())
    )
  );

  let flaggedIds = $derived(Object.values(verdicts).filter(v => v.verdict === 'flag').map(v => v.commentId));

  function timeAgo(date: Date | string) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const ROLE_COLOR: Record<string, string> = {
    internal_team: 'var(--color-accent)',
    investor: '#6366f1',
    buyer: '#0ea5e9',
    agent: '#f59e0b',
  };

  const CATEGORY_LABEL: Record<string, string> = {
    spam: 'Spam',
    offensive: 'Offensive',
    misleading: 'Misleading',
    irrelevant: 'Irrelevant',
  };

  onMount(async () => {
    const res = await fetch('/api/settings/auto-mod').catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      autoMod = d.enabled ?? false;
    }
  });

  async function runAiCheck() {
    if (aiChecking || !comments.length) return;
    aiChecking = true;
    verdicts = {};
    aiError = null;
    try {
      const payload = comments.map(c => ({
        id: c.id,
        content: c.content,
        userName: c.user.name ?? c.user.email,
      }));
      const res = await fetch('/api/articles/comments/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: payload, autoDelete: false }),
      });
      const result = await res.json();
      if (!res.ok) {
        aiError = result.error ?? 'AI check failed';
      } else {
        const map: Record<string, Verdict> = {};
        for (const v of result.verdicts ?? []) map[v.commentId] = v;
        verdicts = map;
        aiChecked = true;
      }
    } catch (e) {
      aiError = 'Network error — could not reach AI service';
    } finally {
      aiChecking = false;
    }
  }

  async function deleteFlagged() {
    for (const id of flaggedIds) {
      await fetch('/api/articles/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: id }),
      });
    }
    const removed = new Set(flaggedIds);
    comments = comments.filter(c => !removed.has(c.id));
    verdicts = {};
    aiChecked = false;
  }

  async function deleteComment(id: string) {
    const res = await fetch('/api/articles/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: id }),
    });
    if (res.ok) {
      comments = comments.filter(c => c.id !== id);
      const next = { ...verdicts };
      delete next[id];
      verdicts = next;
    }
  }

  async function toggleAutoMod() {
    autoModSaving = true;
    const next = !autoMod;
    try {
      await fetch('/api/settings/auto-mod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      autoMod = next;
    } finally {
      autoModSaving = false;
    }
  }
</script>

<svelte:head><title>Comments — Admin</title></svelte:head>

<div style="max-width:900px;">
  <div style="margin-bottom:var(--space-6);">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">CONTENT</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Comments</h1>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-6);">
    {#each [
      { label: 'Total', value: String(comments.length), red: false },
      { label: 'Top-level', value: String(comments.filter(c => !c.parentId).length), red: false },
      { label: 'Replies', value: String(comments.filter(c => c.parentId).length), red: false },
      { label: 'Flagged', value: String(flaggedIds.length), red: flaggedIds.length > 0 },
    ] as kpi}
      <div style="background:rgba(255,255,255,0.6);backdrop-filter:blur(8px);border:1px solid {kpi.red ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.06)'};border-radius:var(--radius-lg);padding:var(--space-5);">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">{kpi.label}</p>
        <p style="font-size:var(--text-xl);font-weight:700;color:{kpi.red ? '#ef4444' : 'var(--color-text)'};margin-top:var(--space-2);">{kpi.value}</p>
      </div>
    {/each}
  </div>

  <!-- Toolbar -->
  <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap;">
    <input class="form-input" type="text" placeholder="Search comments…" bind:value={search} style="max-width:260px;font-size:var(--text-sm);" />

    <div style="margin-left:auto;display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;">
      <!-- AI Check -->
      <button
        onclick={runAiCheck}
        disabled={aiChecking || !comments.length}
        style="display:flex;align-items:center;gap:6px;padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);border:1px solid var(--color-accent);background:transparent;color:var(--color-accent);font-size:var(--text-sm);font-weight:600;cursor:pointer;opacity:{aiChecking ? 0.6 : 1};"
      >{aiChecking ? '✦ Checking…' : '✦ AI Check'}</button>

      <!-- Delete flagged -->
      {#if flaggedIds.length > 0}
        <button
          onclick={deleteFlagged}
          style="padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.06);color:#ef4444;font-size:var(--text-sm);font-weight:600;cursor:pointer;"
        >Delete {flaggedIds.length} flagged</button>
      {/if}

      <!-- Auto-mod toggle -->
      <div style="display:flex;align-items:center;gap:var(--space-2);">
        <span style="font-size:var(--text-xs);color:var(--color-text-muted);white-space:nowrap;">Auto-mod</span>
        <button
          onclick={toggleAutoMod}
          disabled={autoModSaving}
          style="position:relative;width:40px;height:22px;border-radius:99px;border:none;cursor:pointer;background:{autoMod ? 'var(--color-accent)' : 'rgba(0,0,0,0.15)'};transition:background var(--transition-fast);flex-shrink:0;"
        >
          <span style="position:absolute;top:3px;left:{autoMod ? '21px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;"></span>
        </button>
        <span style="font-size:var(--text-xs);font-weight:700;color:{autoMod ? 'var(--color-accent)' : 'var(--color-text-muted)'};">{autoMod ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  </div>

  <!-- Status banners -->
  {#if aiError}
    <div style="padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);font-size:var(--text-sm);color:#ef4444;">
      ⚠ {aiError}
    </div>
  {/if}

  {#if aiChecked && flaggedIds.length === 0}
    <div style="padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);font-size:var(--text-sm);color:#16a34a;">
      ✓ All {comments.length} comments passed AI review — no issues found.
    </div>
  {/if}

  {#if autoMod}
    <div style="padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2);border-radius:var(--radius-md);font-size:var(--text-sm);color:#6366f1;">
      ✦ Auto-moderation is active — new comments are automatically checked and removed if they violate community standards.
    </div>
  {/if}

  <!-- List -->
  <div style="display:flex;flex-direction:column;gap:var(--space-3);">
    {#each filtered as c (c.id)}
      {@const v = verdicts[c.id]}
      {@const flagged = v?.verdict === 'flag'}
      <div style="background:{flagged ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.6)'};backdrop-filter:blur(8px);border:1px solid {flagged ? 'rgba(239,68,68,0.35)' : 'rgba(0,0,0,0.06)'};border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);transition:border-color var(--transition-fast);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-4);">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap;">
              <span style="font-size:var(--text-sm);font-weight:700;color:var(--color-text);">{c.user.name ?? c.user.email.split('@')[0]}</span>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:{ROLE_COLOR[c.user.role] ?? '#888'};">{c.user.role}</span>
              {#if c.parentId}
                <span style="font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(0,0,0,0.05);color:var(--color-text-muted);">reply</span>
              {/if}
              {#if flagged}
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(239,68,68,0.1);color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;">⚠ {CATEGORY_LABEL[v.category] ?? v.category}</span>
              {:else if v?.verdict === 'ok'}
                <span style="font-size:10px;padding:2px 7px;border-radius:99px;background:rgba(34,197,94,0.08);color:#16a34a;">✓ OK</span>
              {/if}
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);margin-left:auto;">{timeAgo(c.createdAt)}</span>
            </div>

            <p style="font-size:var(--text-sm);color:var(--color-text);line-height:1.6;margin:0 0 var(--space-2);white-space:pre-wrap;">{c.content}</p>

            {#if flagged && v.reason}
              <p style="font-size:var(--text-xs);color:#ef4444;margin:0 0 var(--space-3);font-style:italic;">AI: {v.reason}</p>
            {/if}

            <div style="display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;">
              <a href="/knowledge/{c.article.slug}" target="_blank" style="font-size:var(--text-xs);color:var(--color-accent);text-decoration:none;">↗ {c.article.title}</a>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted);">♥ {c.likes.length}</span>
              {#if c.replies.length > 0}
                <span style="font-size:var(--text-xs);color:var(--color-text-muted);">{c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}</span>
              {/if}
            </div>
          </div>

          <button
            onclick={() => deleteComment(c.id)}
            style="flex-shrink:0;font-size:var(--text-xs);color:#ef4444;background:none;border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:var(--space-1) var(--space-3);cursor:pointer;transition:background var(--transition-fast);"
            onmouseenter={(e) => (e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.08)'}
            onmouseleave={(e) => (e.currentTarget as HTMLButtonElement).style.background='none'}
          >Delete</button>
        </div>
      </div>
    {/each}

    {#if filtered.length === 0}
      <p style="text-align:center;padding:var(--space-10);font-size:var(--text-sm);color:var(--color-text-muted);">No comments found.</p>
    {/if}
  </div>
</div>
