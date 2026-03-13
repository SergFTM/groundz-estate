<script lang="ts">
  import { enhance } from '$app/forms';
  import SeoPanel from '$lib/modules/seo/components/SeoPanel.svelte';

  let { data, form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );

  // Mirror form fields so SeoPanel reacts to changes in real time
  let title = $state(data.article.title);
  let slug = $state(data.article.slug);
  let content = $state(data.article.content);
</script>

<svelte:head>
  <title>Edit {data.article.title} — Admin — Develta</title>
</svelte:head>

<a href="/admin/articles" class="back-link">← Back to Articles</a>

<div class="edit-header">
  <div>
    <span class="edit-header__sup">Content</span>
    <h1 class="edit-header__title">Edit Article</h1>
  </div>
</div>

{#if form?.success}
  <div class="alert-success">Article updated successfully.</div>
{/if}

<div class="edit-layout">
  <!-- ── Left: form ── -->
  <div class="edit-layout__main">
    <div class="card">
      <form method="POST" action="?/update" use:enhance>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="title">Title</label>
            <input class="form-input" id="title" name="title"
              value={title}
              oninput={(e) => title = (e.target as HTMLInputElement).value}
              required />
            {#if formErrors.title}<p class="form-error">{formErrors.title}</p>{/if}
          </div>
          <div class="form-group">
            <label class="form-label" for="slug">Slug</label>
            <input class="form-input" id="slug" name="slug"
              value={slug}
              oninput={(e) => slug = (e.target as HTMLInputElement).value}
              required />
            {#if formErrors.slug}<p class="form-error">{formErrors.slug}</p>{/if}
          </div>
          <div class="form-group">
            <label class="form-label" for="category">Category</label>
            <input class="form-input" id="category" name="category" value={data.article.category} required />
            {#if formErrors.category}<p class="form-error">{formErrors.category}</p>{/if}
          </div>
          <div class="form-group">
            <label class="form-label" for="imageUrl">Image URL</label>
            <input class="form-input" id="imageUrl" name="imageUrl" type="url" value={data.article.imageUrl ?? ''} placeholder="https://..." />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="excerpt">Excerpt</label>
            <textarea class="form-input" id="excerpt" name="excerpt" rows="2">{data.article.excerpt ?? ''}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="content">Content (HTML)</label>
            <textarea
              class="form-input form-input--mono"
              id="content" name="content" rows="16"
              oninput={(e) => content = (e.target as HTMLTextAreaElement).value}
              required
            >{content}</textarea>
            {#if formErrors.content}<p class="form-error">{formErrors.content}</p>{/if}
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">Save Changes</button>
          <a href="/admin/articles" class="btn-cancel">Cancel</a>
        </div>
      </form>
    </div>

    <!-- Danger Zone -->
    <div class="card card--danger">
      <h2 class="danger-title">Danger Zone</h2>
      <p class="danger-sub">Permanently delete this article. This cannot be undone.</p>
      <form method="POST" action="?/delete" use:enhance>
        <button
          type="submit"
          class="btn btn--danger"
          onclick={(e) => { if (!confirm('Delete this article? This cannot be undone.')) e.preventDefault(); }}
        >Delete Article</button>
      </form>
    </div>
  </div>

  <!-- ── Right: SEO panel (admin / internal_team only) ── -->
  <div class="edit-layout__seo">
    <SeoPanel
      articleId={data.article.id}
      {title}
      {content}
      {slug}
      locale="en"
      existingProfileId={data.seoProfileId}
    />
  </div>
</div>

<style>
  .back-link {
    font-size: var(--text-sm);
    color: var(--color-accent);
    text-decoration: none;
    font-weight: 600;
    display: inline-block;
    margin-bottom: var(--space-4);
  }

  .edit-header {
    margin-bottom: var(--space-6);
  }

  .edit-header__sup {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .edit-header__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: var(--space-1) 0 0;
  }

  .alert-success {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
    color: #22c55e;
  }

  /* Two-column layout: form + SEO panel */
  .edit-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: var(--space-6);
    align-items: start;
  }

  .edit-layout__main {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .edit-layout__seo {
    min-width: 0;
  }

  /* Cards */
  .card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
  }

  .card--danger {
    border-color: rgba(239, 68, 68, 0.12);
  }

  /* Form grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-5);
    margin-bottom: var(--space-6);
  }

  .form-group { display: flex; flex-direction: column; }
  .form-group--full { grid-column: 1 / -1; }

  .form-input--mono {
    font-family: monospace;
    font-size: var(--text-sm);
    resize: vertical;
  }

  .form-error {
    font-size: var(--text-xs);
    color: #ef4444;
    margin-top: var(--space-1);
  }

  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  .btn-cancel {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-decoration: none;
  }

  /* Danger zone */
  .danger-title {
    font-size: var(--text-base);
    font-weight: 700;
    color: #ef4444;
    margin: 0 0 var(--space-2);
  }

  .danger-sub {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-4);
  }

  .btn--danger {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  @media (max-width: 1100px) {
    .edit-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
