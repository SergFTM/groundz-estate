<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();

  let grouped = $derived.by(() => {
    const map = new Map<string, typeof data.faqs>();
    for (const faq of data.faqs) {
      const cat = faq.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(faq);
    }
    return map;
  });
</script>

<svelte:head>
  <title>FAQ — Admin — Develta</title>
</svelte:head>

<div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">FAQ</h1>
    </div>
    <a href="/admin/faq/new" class="btn btn--primary">+ New FAQ</a>
  </div>

  {#if data.faqs.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No FAQs yet. <a href="/admin/faq/new" style="color:var(--color-accent);">Create one</a>.
    </div>
  {:else}
    {#each [...grouped] as [category, items]}
      <div style="margin-bottom:var(--space-6);">
        <h2 style="font-size:var(--text-xs);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:var(--space-3);">{category}</h2>
        <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
          {#each items as faq, i}
            <button
              type="button"
              onclick={() => goto(`/admin/faq/${faq.id}/edit`)}
              style="display:flex;align-items:center;gap:var(--space-4);width:100%;padding:var(--space-4) var(--space-5);text-align:left;cursor:pointer;background:none;border:none;{i < items.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.04);' : ''}"
              onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'}
              onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}
            >
              <span style="font-size:var(--text-xs);font-family:monospace;color:var(--color-text-muted);min-width:24px;">{faq.sortOrder}</span>
              <span style="font-size:var(--text-sm);color:var(--color-text);font-weight:600;flex:1;">{faq.question}</span>
              <span style="font-size:var(--text-xs);color:var(--color-accent);font-weight:600;">Edit</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>
