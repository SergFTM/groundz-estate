<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatDate } from '$lib/utils/formatters';

  let { data } = $props();
</script>

<svelte:head>
  <title>Articles — Admin — Develta</title>
</svelte:head>

<div>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
    <div>
      <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
      <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Articles</h1>
    </div>
    <a href="/admin/articles/new" class="btn btn--primary">+ New Article</a>
  </div>

  {#if data.articles.length === 0}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-16);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
      No articles yet. <a href="/admin/articles/new" style="color:var(--color-accent);">Create one</a>.
    </div>
  {:else}
    <div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            {#each ['Title','Category','Slug','Published',''] as col}
              <th style="padding:var(--space-3) var(--space-4);text-align:left;font-size:var(--text-xs);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--color-text-muted);">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.articles as article}
            <tr
              style="border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;"
              onclick={() => goto(`/admin/articles/${article.id}/edit`)}
              onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'}
              onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}
            >
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-weight:600;">{article.title}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{article.category}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);font-family:monospace;color:var(--color-text-muted);">{article.slug}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">{formatDate(article.publishedAt)}</td>
              <td style="padding:var(--space-3) var(--space-4);font-size:var(--text-sm);">
                <a href="/admin/articles/{article.id}/edit" style="color:var(--color-accent);text-decoration:none;font-weight:600;font-size:var(--text-xs);">Edit</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
