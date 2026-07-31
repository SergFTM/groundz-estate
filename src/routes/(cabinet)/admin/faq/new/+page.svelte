<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  let formErrors = $derived(
    (form as { errors?: Record<string, string> } | null)?.errors ?? {}
  );
</script>

<svelte:head>
  <title>New FAQ — Admin — Groundz</title>
</svelte:head>

<a href="/admin/faq" style="font-size:var(--text-sm);color:var(--color-accent);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:var(--space-4);">← Back to FAQ</a>

<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:var(--space-6);">
  <div>
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Content</span>
    <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--color-text);margin-top:var(--space-1);">New FAQ</h1>
  </div>
</div>

<div style="background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.06);border-radius:var(--radius-lg);padding:var(--space-8);">
  <form method="POST" action="?/create" use:enhance>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="category">Category</label>
        <input class="form-input" id="category" name="category" value="General" placeholder="e.g. General, Investment, Legal" required />
        {#if formErrors.category}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.category}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="sortOrder">Sort Order</label>
        <input class="form-input" id="sortOrder" name="sortOrder" type="number" min="0" value="0" />
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="question">Question</label>
        <input class="form-input" id="question" name="question" placeholder="What is…?" required />
        {#if formErrors.question}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.question}</p>{/if}
      </div>
      <div class="form-group" style="margin-bottom:0;grid-column:1/-1;">
        <label class="form-label" for="answer">Answer</label>
        <textarea class="form-input" id="answer" name="answer" rows="6" placeholder="The answer to the question…" style="resize:vertical;" required></textarea>
        {#if formErrors.answer}<p style="font-size:var(--text-xs);color:#ef4444;margin-top:var(--space-1);">{formErrors.answer}</p>{/if}
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);align-items:center;">
      <button type="submit" class="btn btn--primary">Create FAQ</button>
      <a href="/admin/faq" style="font-size:var(--text-sm);color:var(--color-text-muted);text-decoration:none;">Cancel</a>
    </div>
  </form>
</div>
