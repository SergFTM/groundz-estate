<script lang="ts">
  import SeoScore from './SeoScore.svelte';
  import SeoIssueList from './SeoIssueList.svelte';
  import SeoMetaPreview from './SeoMetaPreview.svelte';
  import type { SeoAuditResult } from '../types/seoTypes.js';

  interface Props {
    articleId: string;
    title: string;
    content: string;
    slug?: string;
    locale?: 'en' | 'ru';
    existingProfileId?: string | null;
  }

  let {
    articleId,
    title,
    content,
    slug = '',
    locale = 'en',
    existingProfileId = null,
  }: Props = $props();

  let audit = $state<SeoAuditResult | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let aiNotAvailable = $state(false);

  // Meta fields (editable after generation)
  let metaTitle = $state<string | null>(null);
  let metaDesc = $state<string | null>(null);
  let metaLoading = $state(false);

  // Suggestions state
  let linksLoading = $state(false);
  let linkSuggestions = $state<{ toRoute: string; anchorText: string; confidence: number }[]>([]);
  let semanticTab = $state<'issues' | 'semantic' | 'links'>('issues');

  // Rewrite suggestion state
  let rewriteLoading = $state(false);
  let rewriteResult = $state<{ proposedText: string; revisionId: string } | null>(null);

  async function runAudit() {
    loading = true;
    error = null;
    try {
      // Build minimal HTML from article fields for rule engine
      const html = buildHtml();
      const res = await fetch('/api/seo/audit-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: existingProfileId ?? undefined,
          route: `/knowledge/${slug}`,
          html,
          locale,
          pageType: 'article',
        }),
      });
      if (!res.ok) throw new Error(`Audit failed: ${res.status}`);
      const result: SeoAuditResult = await res.json();
      audit = result;
      aiNotAvailable = !result.aiAvailable;
      // Pre-fill meta from profile if exists
      if (!metaTitle && result.meta?.metaTitle) metaTitle = result.meta.metaTitle;
      if (!metaDesc && result.meta?.metaDescription) metaDesc = result.meta.metaDescription;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function generateMeta() {
    if (!audit) return;
    metaLoading = true;
    try {
      const profileId = existingProfileId ?? audit.auditId;
      const res = await fetch('/api/seo/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: profileId,
          title,
          content: content.replace(/<[^>]+>/g, ' ').slice(0, 1500),
          targetKeywords: [],
          locale,
        }),
      });
      if (!res.ok) throw new Error('Meta generation failed');
      const data = await res.json();
      metaTitle = data.metaTitle;
      metaDesc = data.metaDescription;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      metaLoading = false;
    }
  }

  async function suggestLinks() {
    linksLoading = true;
    try {
      const res = await fetch('/api/seo/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromRoute: `/knowledge/${slug}`,
          content: content.replace(/<[^>]+>/g, ' ').slice(0, 3000),
          topN: 5,
        }),
      });
      if (!res.ok) throw new Error('Link suggestion failed');
      const data = await res.json();
      linkSuggestions = data.suggestions;
      semanticTab = 'links';
    } catch (e) {
      error = (e as Error).message;
    } finally {
      linksLoading = false;
    }
  }

  async function suggestRewrite() {
    if (!audit) return;
    rewriteLoading = true;
    rewriteResult = null;
    error = null;
    try {
      const profileId = existingProfileId ?? audit.auditId;
      const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
      const res = await fetch('/api/seo/rewrite-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: profileId,
          sectionType: 'body',
          originalText: plainText,
        }),
      });
      if (!res.ok) throw new Error(`Rewrite failed: ${res.status}`);
      const data = await res.json();
      rewriteResult = { proposedText: data.proposedText, revisionId: data.revisionId };
    } catch (e) {
      error = (e as Error).message;
    } finally {
      rewriteLoading = false;
    }
  }

  function buildHtml(): string {
    return `<!DOCTYPE html><html><head>
      <title>${escHtml(title)}</title>
      <meta name="description" content="">
      <link rel="canonical" href="https://develta.cy/knowledge/${escHtml(slug)}">
    </head><body>
      <h1>${escHtml(title)}</h1>
      ${content}
    </body></html>`;
  }

  function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function scoreLabel(s: number): string {
    if (s >= 80) return 'Good';
    if (s >= 50) return 'Needs work';
    return 'Poor';
  }
</script>

<aside class="seo-panel">
  <div class="seo-panel__header">
    <span class="seo-panel__title">SEO</span>
    {#if aiNotAvailable}
      <span class="seo-panel__ai-badge">rule-only</span>
    {/if}
  </div>

  <!-- Score + run button -->
  <div class="seo-panel__score-row">
    <SeoScore score={audit?.score ?? null} {loading} />
    <div class="seo-panel__score-meta">
      {#if audit}
        <span class="seo-panel__score-label">{scoreLabel(audit.score)}</span>
        <span class="seo-panel__issue-count">{audit.issues.length} issue{audit.issues.length !== 1 ? 's' : ''}</span>
      {:else}
        <span class="seo-panel__hint">Run audit to see score</span>
      {/if}
      <button class="seo-btn seo-btn--primary" onclick={runAudit} disabled={loading}>
        {loading ? 'Analyzing…' : audit ? 'Re-run Audit' : 'Run Audit'}
      </button>
    </div>
  </div>

  {#if error}
    <div class="seo-panel__error">{error}</div>
  {/if}

  {#if audit}
    <!-- Tabs -->
    <div class="seo-tabs">
      <button class="seo-tab" class:seo-tab--active={semanticTab === 'issues'} onclick={() => semanticTab = 'issues'}>
        Issues {#if audit.issues.length > 0}<span class="seo-tab__count">{audit.issues.length}</span>{/if}
      </button>
      {#if audit.semantics}
        <button class="seo-tab" class:seo-tab--active={semanticTab === 'semantic'} onclick={() => semanticTab = 'semantic'}>
          Semantic
        </button>
      {/if}
      <button class="seo-tab" class:seo-tab--active={semanticTab === 'links'} onclick={() => semanticTab = 'links'}>
        Links
      </button>
    </div>

    {#if semanticTab === 'issues'}
      <SeoIssueList issues={audit.issues} />
    {:else if semanticTab === 'semantic' && audit.semantics}
      <div class="seo-semantic">
        {#if audit.semantics.missingTopics.length}
          <p class="seo-semantic__heading">Missing topics</p>
          <ul class="seo-chip-list">
            {#each audit.semantics.missingTopics as t}
              <li class="seo-chip seo-chip--warn">{t}</li>
            {/each}
          </ul>
        {/if}
        {#if audit.semantics.missingEntities.length}
          <p class="seo-semantic__heading">Missing entities</p>
          <ul class="seo-chip-list">
            {#each audit.semantics.missingEntities as e}
              <li class="seo-chip">{e}</li>
            {/each}
          </ul>
        {/if}
        {#if audit.semantics.suggestedH2.length}
          <p class="seo-semantic__heading">Suggested headings</p>
          <ul class="seo-semantic__list">
            {#each audit.semantics.suggestedH2 as h}
              <li>{h}</li>
            {/each}
          </ul>
        {/if}
        {#if audit.semantics.faqQuestions.length}
          <p class="seo-semantic__heading">FAQ gaps</p>
          <ul class="seo-semantic__list">
            {#each audit.semantics.faqQuestions.slice(0, 4) as q}
              <li>{q}</li>
            {/each}
          </ul>
        {/if}

        <div class="seo-rewrite">
          <div class="seo-rewrite__head">
            <span class="seo-semantic__heading">Content rewrite</span>
            <button class="seo-btn seo-btn--outline seo-btn--sm" onclick={suggestRewrite} disabled={rewriteLoading || !existingProfileId && !audit?.auditId}>
              {rewriteLoading ? 'Generating…' : rewriteResult ? 'Re-generate' : '✦ Suggest rewrite'}
            </button>
          </div>
          {#if rewriteResult}
            <div class="seo-rewrite__result">
              <p class="seo-rewrite__label">Proposed (saved for review)</p>
              <p class="seo-rewrite__text">{rewriteResult.proposedText}</p>
            </div>
          {:else if !rewriteLoading}
            <p class="seo-rewrite__hint">AI will propose a rewritten version of your article body, saved to Content Revisions for admin approval.</p>
          {/if}
        </div>
      </div>
    {:else if semanticTab === 'links'}
      <div class="seo-links">
        {#if linkSuggestions.length === 0}
          <button class="seo-btn seo-btn--outline" onclick={suggestLinks} disabled={linksLoading}>
            {linksLoading ? 'Finding links…' : 'Suggest internal links'}
          </button>
        {:else}
          <p class="seo-semantic__heading">Suggested links ({linkSuggestions.length})</p>
          {#each linkSuggestions as s}
            <div class="seo-link-row">
              <span class="seo-link-route">{s.toRoute}</span>
              <span class="seo-link-anchor">"{s.anchorText}"</span>
              <span class="seo-link-conf">{Math.round(s.confidence * 100)}%</span>
            </div>
          {/each}
        {/if}
      </div>
    {/if}

    <!-- Meta section -->
    <div class="seo-panel__section">
      <div class="seo-panel__section-head">
        <span class="seo-panel__section-title">Meta Tags</span>
        <button class="seo-btn seo-btn--outline seo-btn--sm" onclick={generateMeta} disabled={metaLoading}>
          {metaLoading ? '…' : 'Generate'}
        </button>
      </div>
      <SeoMetaPreview title={metaTitle} description={metaDesc} url="develta.cy/knowledge/{slug}" />
      {#if metaTitle || metaDesc}
        <div class="seo-meta-fields">
          {#if metaTitle}
            <div class="seo-meta-field">
              <span class="seo-meta-label">Meta Title</span>
              <p class="seo-meta-value">{metaTitle}</p>
            </div>
          {/if}
          {#if metaDesc}
            <div class="seo-meta-field">
              <span class="seo-meta-label">Meta Description</span>
              <p class="seo-meta-value">{metaDesc}</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</aside>

<style>
  .seo-panel {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
    max-height: calc(100vh - var(--header-height) - var(--space-8));
    overflow-y: auto;
  }

  .seo-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .seo-panel__title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .seo-panel__ai-badge {
    font-size: 9px;
    background: #fff8ed;
    border: 1px solid #fad59a;
    border-radius: 4px;
    padding: 1px 5px;
    color: #b45309;
  }

  .seo-panel__score-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .seo-panel__score-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .seo-panel__score-label {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
  }

  .seo-panel__issue-count {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .seo-panel__hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
  }

  .seo-panel__error {
    font-size: var(--text-xs);
    color: #e5484d;
    background: #fff0f0;
    border: 1px solid #fcc;
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
  }

  /* Tabs */
  .seo-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0;
  }

  .seo-tab {
    background: none;
    border: none;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .seo-tab--active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
    font-weight: 700;
  }

  .seo-tab__count {
    background: var(--color-accent);
    color: #fff;
    font-size: 9px;
    border-radius: 8px;
    padding: 0 5px;
    line-height: 16px;
  }

  /* Semantic tab */
  .seo-semantic { display: flex; flex-direction: column; gap: var(--space-2); }

  .seo-semantic__heading {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .seo-chip-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .seo-chip {
    font-size: 10px;
    background: #f0f4ff;
    border: 1px solid #c7d3f5;
    border-radius: 4px;
    padding: 1px 6px;
    color: #3a5bc7;
  }

  .seo-chip--warn {
    background: #ffedd5;
    border-color: #fdba74;
    color: #9a3412;
  }

  .seo-semantic__list {
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* Rewrite suggestion */
  .seo-rewrite {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .seo-rewrite__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .seo-rewrite__hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.4;
    font-style: italic;
  }

  .seo-rewrite__result {
    background: #f0f7ff;
    border: 1px solid #bcd6f5;
    border-radius: var(--radius-sm);
    padding: var(--space-3);
  }

  .seo-rewrite__label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #3a5bc7;
    margin: 0 0 4px;
  }

  .seo-rewrite__text {
    font-size: var(--text-xs);
    color: var(--color-text);
    margin: 0;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Links tab */
  .seo-links { display: flex; flex-direction: column; gap: var(--space-2); }

  .seo-link-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    padding: 4px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .seo-link-row:last-child { border-bottom: none; }

  .seo-link-route {
    font-family: monospace;
    color: var(--color-accent);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .seo-link-anchor {
    color: var(--color-text-muted);
    font-style: italic;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .seo-link-conf {
    color: #22a06b;
    font-weight: 700;
    white-space: nowrap;
  }

  /* Meta section */
  .seo-panel__section {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .seo-panel__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .seo-panel__section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .seo-meta-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .seo-meta-field {
    background: var(--color-bg-soft, #f9f9f9);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
  }

  .seo-meta-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--color-text-muted);
    display: block;
    margin-bottom: 2px;
  }

  .seo-meta-value {
    font-size: var(--text-xs);
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
  }

  /* Buttons */
  .seo-btn {
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    padding: var(--space-2) var(--space-3);
    transition: opacity var(--transition-fast);
    border: none;
  }

  .seo-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .seo-btn--primary {
    background: var(--color-accent);
    color: #fff;
  }
  .seo-btn--primary:hover:not(:disabled) { opacity: 0.85; }

  .seo-btn--outline {
    background: transparent;
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
  }
  .seo-btn--outline:hover:not(:disabled) { background: rgba(var(--color-accent-rgb, 180,140,90), 0.06); }

  .seo-btn--sm { padding: 2px var(--space-2); font-size: 10px; }
</style>
