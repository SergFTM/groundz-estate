<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>Edit {data.article.title} — Admin — Develta</title>
</svelte:head>

<a href="/admin/articles" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to Articles</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">Edit Article</h1>
  </div>
</div>

{#if form?.success}
  <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#22c55e;">
    Article updated successfully.
  </div>
{/if}

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);margin-bottom:var(--space-6);">
  <form method="POST" action="?/update" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="title">Title</label>
        <input class="form-input" id="title" name="title" value={data.article.title} required />
        {#if formErrors.title}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.title}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="slug">Slug</label>
        <input class="form-input" id="slug" name="slug" value={data.article.slug} required />
        {#if formErrors.slug}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.slug}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="category">Category</label>
        <input class="form-input" id="category" name="category" value={data.article.category} required />
        {#if formErrors.category}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.category}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="imageUrl">Image URL</label>
        <input class="form-input" id="imageUrl" name="imageUrl" type="url" value={data.article.imageUrl ?? ''} placeholder="https://..." />
        {#if formErrors.imageUrl}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.imageUrl}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="excerpt">Excerpt</label>
        <textarea class="form-input" id="excerpt" name="excerpt" rows="2" style="resize:vertical;">{data.article.excerpt ?? ''}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="content">Content (HTML)</label>
        <textarea class="form-input" id="content" name="content" rows="12" style="resize:vertical;font-family:monospace;font-size:var(--text-sm);" required>{data.article.content}</textarea>
        {#if formErrors.content}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.content}</p>{/if}
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Save Changes</button>
      <a href="/admin/articles" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(239,68,68,0.12);border-radius:var(--radius-lg);padding:var(--space-8);">
  <h2 style="font-size:var(--text-base);font-weight:700;color:#ef4444;margin-bottom:var(--space-2);">Danger Zone</h2>
  <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">Permanently delete this article. This cannot be undone.</p>
  <form method="POST" action="?/delete" use:enhance>
    <button
      type="submit"
      style="background:#ef4444;color:white;border:none;border-radius:var(--radius-md);padding:var(--space-2) var(--space-4);font-size:var(--text-sm);font-weight:600;cursor:pointer;"
      onclick={(e) => { if (!confirm('Delete this article? This cannot be undone.')) e.preventDefault(); }}
    >Delete Article</button>
  </form>
</div>
