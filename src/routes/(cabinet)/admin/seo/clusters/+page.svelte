<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);

  // AI generation state
  let aiTopic = $state('');
  let aiLocale = $state('en');
  let aiLoading = $state(false);
  let aiError = $state('');

  // Form field state (filled by AI or manually)
  let name = $state('');
  let primaryTerm = $state('');
  let locale = $state('en');
  let intent = $state('commercial');
  let terms = $state('');

  async function generateWithAI() {
    if (!aiTopic.trim()) return;
    aiLoading = true;
    aiError = '';
    try {
      const res = await fetch('/api/seo/generate-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, locale: aiLocale }),
      });
      const result = await res.json();
      if (!res.ok || result.error) { aiError = result.error ?? 'AI error'; return; }
      name = result.name ?? '';
      primaryTerm = result.primaryTerm ?? '';
      locale = result.locale ?? aiLocale;
      intent = result.intent ?? 'commercial';
      terms = (result.terms ?? []).join(', ');
    } catch {
      aiError = 'Network error';
    } finally {
      aiLoading = false;
    }
  }

  function openForm() {
    showForm = true;
    name = ''; primaryTerm = ''; locale = 'en'; intent = 'commercial'; terms = '';
    aiTopic = ''; aiError = '';
  }
</script>

<div class="clusters">
  <div class="clusters__header">
    <div>
      <h1 class="clusters__title">Keyword Clusters</h1>
      <p class="clusters__sub">{data.clusters.length} clusters defined</p>
    </div>
    <button class="btn-primary" onclick={() => showForm ? showForm = false : openForm()}>
      {showForm ? 'Cancel' : '+ New Cluster'}
    </button>
  </div>

  {#if showForm}
    <div class="cluster-form">
      <!-- AI generation row -->
      <div class="ai-row">
        <span class="ai-row__label">Generate with AI</span>
        <input
          class="ai-row__input"
          type="text"
          placeholder="e.g. luxury apartments Limassol buy"
          bind:value={aiTopic}
          onkeydown={(e) => e.key === 'Enter' && generateWithAI()}
        />
        <select class="ai-row__select" bind:value={aiLocale}>
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>
        <button class="btn-ai" onclick={generateWithAI} disabled={aiLoading || !aiTopic.trim()}>
          {aiLoading ? 'Generating…' : '✦ Generate'}
        </button>
      </div>
      {#if aiError}<p class="ai-error">{aiError}</p>{/if}

      <div class="divider"><span>or fill manually</span></div>

      <form method="POST" action="?/create" use:enhance>
        <div class="cluster-form__grid">
          <div class="field">
            <label for="name">Cluster Name</label>
            <input id="name" name="name" type="text" placeholder="Cyprus investment real estate"
              bind:value={name} required />
          </div>
          <div class="field">
            <label for="primaryTerm">Primary Keyword</label>
            <input id="primaryTerm" name="primaryTerm" type="text" placeholder="buy apartment Limassol"
              bind:value={primaryTerm} required />
          </div>
          <div class="field">
            <label for="locale">Locale</label>
            <select id="locale" name="locale" bind:value={locale}>
              <option value="en">English</option>
              <option value="ru">Russian</option>
            </select>
          </div>
          <div class="field">
            <label for="intent">Intent</label>
            <select id="intent" name="intent" bind:value={intent}>
              <option value="commercial">Commercial</option>
              <option value="informational">Informational</option>
              <option value="transactional">Transactional</option>
            </select>
          </div>
          <div class="field field--full">
            <label for="terms">Related Terms (comma-separated)</label>
            <input id="terms" name="terms" type="text"
              placeholder="apartment Cyprus, Limassol property, VAT 5% Cyprus"
              bind:value={terms} />
          </div>
        </div>
        <button type="submit" class="btn-primary">Create Cluster</button>
      </form>
    </div>
  {/if}

  {#if data.clusters.length === 0}
    <div class="empty-state">No clusters yet. Create your first keyword cluster.</div>
  {:else}
    <div class="cluster-list">
      {#each data.clusters as c}
        <div class="cluster-card">
          <div class="cluster-card__top">
            <span class="cluster-card__name">{c.name}</span>
            <div class="cluster-card__tags">
              <span class="tag tag--{c.locale}">{c.locale}</span>
              <span class="tag">{c.intent}</span>
              <span class="tag">{c._count.pageProfiles} pages</span>
            </div>
          </div>
          <div class="cluster-card__term">{c.primaryTerm}</div>
          {#if c.termsJson}
            <div class="cluster-card__terms">
              {#each (JSON.parse(c.termsJson) as string[]).slice(0, 6) as term}
                <span class="term-chip">{term}</span>
              {/each}
            </div>
          {/if}
          <form method="POST" action="?/delete" use:enhance class="cluster-card__del">
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" class="btn-danger-sm">Delete</button>
          </form>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .clusters {
    max-width: 900px;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .clusters__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .clusters__title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-1);
  }

  .clusters__sub {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .btn-primary {
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .btn-primary:hover { opacity: 0.85; }

  .btn-danger-sm {
    background: none;
    border: 1px solid #e5484d;
    color: #e5484d;
    border-radius: var(--radius-sm);
    padding: 2px 8px;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .btn-danger-sm:hover { background: #fff0f0; }

  .cluster-form {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .ai-row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    flex-wrap: wrap;
  }

  .ai-row__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .ai-row__input {
    flex: 1;
    min-width: 200px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .ai-row__select {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .btn-ai {
    background: #1a1a2e;
    color: #c9b97a;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity var(--transition-fast);
  }
  .btn-ai:hover:not(:disabled) { opacity: 0.85; }
  .btn-ai:disabled { opacity: 0.5; cursor: not-allowed; }

  .ai-error {
    font-size: var(--text-xs);
    color: #e5484d;
    margin: 0;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--text-xs);
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .cluster-form__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .field--full { grid-column: 1 / -1; }

  .field label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .field input, .field select {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text);
    width: 100%;
  }

  .empty-state {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .cluster-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .cluster-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .cluster-card__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .cluster-card__name { font-weight: 700; color: var(--color-text); }

  .cluster-card__tags, .cluster-card__terms {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .cluster-card__term {
    font-size: var(--text-sm);
    color: var(--color-accent);
    font-weight: 600;
  }

  .cluster-card__del { align-self: flex-end; }

  .tag {
    font-size: 10px;
    background: var(--color-bg-soft, #f5f5f5);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 6px;
    color: var(--color-text-muted);
  }

  .term-chip {
    font-size: 11px;
    background: #f0f4ff;
    border: 1px solid #c7d3f5;
    border-radius: 4px;
    padding: 1px 6px;
    color: #3a5bc7;
  }
</style>
