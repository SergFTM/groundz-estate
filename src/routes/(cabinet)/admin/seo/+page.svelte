<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // ── Wizard state ──────────────────────────────────────────
  type WizardStep = 'idle' | 'analyzing' | 'review' | 'applying' | 'done' | 'hidden';
  let wizardStep = $state<WizardStep>(data.isFirstRun ? 'idle' : 'hidden');

  interface ClusterSuggestion {
    name: string;
    primaryTerm: string;
    intent: string;
    locale: string;
    terms: string[];
    entities?: string[];
    reason: string;
    selected: boolean;
  }

  let suggestions = $state<ClusterSuggestion[]>([]);
  let wizardError = $state('');
  let applyResult = $state<{ clustersCreated: number; articlesQueued: number } | null>(null);

  interface ChatMsg { from: 'ai' | 'user'; text: string; }
  let messages = $state<ChatMsg[]>([]);

  function addMsg(from: ChatMsg['from'], text: string) {
    messages = [...messages, { from, text }];
  }

  async function startAnalysis() {
    wizardStep = 'analyzing';
    messages = [];
    addMsg('ai', `Found ${data.articleCount} articles in your knowledge base. Analyzing topics and generating keyword clusters…`);
    wizardError = '';

    try {
      const res = await fetch('/api/seo/setup/analyze', { method: 'POST' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) { wizardError = result.error ?? result.message ?? `Server error ${res.status}`; wizardStep = 'idle'; return; }

      suggestions = (result.clusters as Omit<ClusterSuggestion, 'selected'>[]).map(c => ({ ...c, selected: true }));
      addMsg('ai', `Done! I found ${suggestions.length} keyword clusters based on your content. Review them below — uncheck any you don't need, then apply.`);
      wizardStep = 'review';
    } catch {
      wizardError = 'Network error';
      wizardStep = 'idle';
    }
  }

  function toggleSuggestion(i: number) {
    suggestions = suggestions.map((s, idx) => idx === i ? { ...s, selected: !s.selected } : s);
  }

  async function applySetup() {
    const chosen = suggestions.filter(s => s.selected);
    if (!chosen.length) return;
    addMsg('user', `Apply ${chosen.length} clusters and run audits on all articles.`);
    wizardStep = 'applying';
    addMsg('ai', 'Creating keyword clusters and scheduling SEO audits for all articles…');

    try {
      const res = await fetch('/api/seo/setup/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusters: chosen }),
      });
      const result = await res.json();
      if (!res.ok || result.error) { wizardError = result.error ?? 'Apply failed'; wizardStep = 'review'; return; }

      applyResult = result;
      addMsg('ai', `All set! Created ${result.clustersCreated} keyword clusters and queued audits for ${result.articlesQueued} articles. Scores will appear on the dashboard shortly.`);
      wizardStep = 'done';
    } catch {
      wizardError = 'Network error';
      wizardStep = 'review';
    }
  }

  // ── Dashboard helpers ─────────────────────────────────────
  function scoreClass(score: number) {
    if (score >= 80) return 'score--good';
    if (score >= 50) return 'score--medium';
    return 'score--poor';
  }

  function formatDate(d: string | Date | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const intentColor: Record<string, string> = {
    commercial: '#3a5bc7',
    transactional: '#166534',
    informational: '#92400e',
  };

  // ── Lead-page audit (AEO) ─────────────────────────────────
  let leadAuditRunning = $state(false);
  let leadAuditMsg = $state('');

  async function auditLeadPages() {
    leadAuditRunning = true;
    leadAuditMsg = '';
    try {
      const res = await fetch('/api/seo/audit-routes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) {
        leadAuditMsg = result.error ?? `Server error ${res.status}`;
      } else {
        leadAuditMsg = `Audited ${result.audited} lead pages — reloading…`;
        setTimeout(() => location.reload(), 800);
      }
    } catch {
      leadAuditMsg = 'Network error';
    } finally {
      leadAuditRunning = false;
    }
  }
</script>

<div class="seo-dash">
  <div class="seo-dash__header">
    <h1 class="seo-dash__title">SEO Dashboard</h1>
    <p class="seo-dash__subtitle">Monitor and improve your site's search visibility</p>
  </div>

  <!-- ── Setup Wizard ─────────────────────────────────── -->
  {#if wizardStep !== 'hidden'}
    <div class="wizard">
      <div class="wizard__chat">
        {#if messages.length === 0 && wizardStep === 'idle'}
          <div class="chat-msg chat-msg--ai">
            <span class="chat-avatar">✦</span>
            <div class="chat-bubble">
              <p>Hi! SEO is not configured yet. I can analyze your <strong>{data.articleCount} articles</strong> and automatically generate keyword clusters, then run audits on all pages.</p>
              <p>This takes about 10–20 seconds. Want me to set it up?</p>
            </div>
          </div>
        {/if}

        {#each messages as msg}
          <div class="chat-msg chat-msg--{msg.from}">
            {#if msg.from === 'ai'}<span class="chat-avatar">✦</span>{/if}
            <div class="chat-bubble">{msg.text}</div>
          </div>
        {/each}

        {#if wizardError}<p class="wizard-error">{wizardError}</p>{/if}
      </div>

      {#if wizardStep === 'idle'}
        <div class="wizard__actions">
          <button class="btn-wizard-primary" onclick={startAnalysis}>
            ✦ Analyze & Setup SEO Automatically
          </button>
          <button class="btn-wizard-skip" onclick={() => wizardStep = 'hidden'}>
            Skip for now
          </button>
        </div>
      {/if}

      {#if wizardStep === 'analyzing'}
        <div class="wizard__spinner">
          <span class="spinner"></span> Analyzing content with AI…
        </div>
      {/if}

      {#if wizardStep === 'review'}
        <div class="wizard__review">
          <p class="wizard__review-label">Select clusters to create:</p>
          <div class="suggestion-grid">
            {#each suggestions as s, i}
              <label class="suggestion-card" class:suggestion-card--off={!s.selected}>
                <input type="checkbox" checked={s.selected} onchange={() => toggleSuggestion(i)} />
                <div class="suggestion-card__body">
                  <div class="suggestion-card__top">
                    <span class="suggestion-name">{s.name}</span>
                    <span class="suggestion-intent" style="color:{intentColor[s.intent] ?? '#666'}">{s.intent}</span>
                  </div>
                  <div class="suggestion-primary">{s.primaryTerm}</div>
                  <div class="suggestion-terms">
                    {#each (s.terms ?? []).slice(0, 5) as t}
                      <span class="term-chip">{t}</span>
                    {/each}
                    {#if (s.terms ?? []).length > 5}
                      <span class="term-chip term-chip--more">+{s.terms.length - 5}</span>
                    {/if}
                  </div>
                  <p class="suggestion-reason">{s.reason}</p>
                </div>
              </label>
            {/each}
          </div>
          <div class="wizard__actions">
            <button
              class="btn-wizard-primary"
              onclick={applySetup}
              disabled={!suggestions.some(s => s.selected)}
            >
              Apply {suggestions.filter(s => s.selected).length} clusters & run audits
            </button>
          </div>
        </div>
      {/if}

      {#if wizardStep === 'applying'}
        <div class="wizard__spinner">
          <span class="spinner"></span> Applying settings and queuing audits…
        </div>
      {/if}

      {#if wizardStep === 'done'}
        <div class="wizard__actions">
          <button class="btn-wizard-primary" onclick={() => location.reload()}>
            Refresh dashboard →
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── KPI strip ─────────────────────────────────────── -->
  <div class="seo-kpi-strip">
    <div class="seo-kpi">
      <span class="seo-kpi__value {scoreClass(data.avgScore)}">{data.avgScore}</span>
      <span class="seo-kpi__label">Avg SEO Score</span>
    </div>
    <div class="seo-kpi">
      <span class="seo-kpi__value">{data.profiles.length}</span>
      <span class="seo-kpi__label">Pages Tracked</span>
    </div>
    <div class="seo-kpi">
      <span class="seo-kpi__value score--poor">{data.issueCount}</span>
      <span class="seo-kpi__label">Open Issues</span>
    </div>
    <div class="seo-kpi">
      <span class="seo-kpi__value {data.pendingRevisions > 0 ? 'score--medium' : ''}">{data.pendingRevisions}</span>
      <span class="seo-kpi__label">Pending Revisions</span>
    </div>
    <div class="seo-kpi">
      <span class="seo-kpi__value {scoreClass(data.avgAeoScore)}">{data.avgAeoScore}</span>
      <span class="seo-kpi__label">Avg AEO Score</span>
    </div>
  </div>

  <div class="seo-dash__grid">
    <section class="seo-card">
      <div class="seo-card__head">
        <h2 class="seo-card__title">Page Profiles</h2>
        <div class="seo-card__actions">
          <button class="seo-lead-audit-btn" onclick={auditLeadPages} disabled={leadAuditRunning}>
            {leadAuditRunning ? 'Auditing…' : '✦ Audit lead pages'}
          </button>
          <a href="/admin/seo/pages" class="seo-card__link">View all →</a>
        </div>
      </div>
      {#if leadAuditMsg}<p class="seo-lead-audit-msg">{leadAuditMsg}</p>{/if}
      {#if data.profiles.length === 0}
        <p class="seo-empty">No pages audited yet.</p>
      {:else}
        <table class="seo-table">
          <thead><tr><th>Route / Type</th><th>Score</th><th>AEO</th><th>Last Audit</th></tr></thead>
          <tbody>
            {#each data.profiles.slice(0, 8) as p}
              <tr>
                <td>
                  <span class="seo-route">{p.route ?? `article:${p.articleId?.slice(0,8)}`}</span>
                  <span class="seo-badge">{p.pageType}</span>
                </td>
                <td><span class="score {scoreClass(p.seoScore ?? 0)}">{p.seoScore ?? '—'}</span></td>
                <td><span class="score {p.aeoScore != null ? scoreClass(p.aeoScore) : ''}">{p.aeoScore ?? '—'}</span></td>
                <td class="seo-date">{formatDate(p.lastAuditAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>

    <section class="seo-card">
      <div class="seo-card__head">
        <h2 class="seo-card__title">Recent Audits</h2>
        <a href="/admin/seo/issues" class="seo-card__link">Issues →</a>
      </div>
      {#if data.recentAudits.length === 0}
        <p class="seo-empty">No audits run yet.</p>
      {:else}
        <ul class="seo-audit-list">
          {#each data.recentAudits.slice(0, 6) as a}
            <li class="seo-audit-item">
              <span class="seo-audit-route">{a.pageProfile?.route ?? '—'}</span>
              <span class="score {scoreClass(a.score)}">{Math.round(a.score)}</span>
              <span class="seo-date">{formatDate(a.createdAt)}</span>
              {#if !a.aiAvailable}<span class="seo-ai-badge">rule-only</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>

  <div class="seo-quick-links">
    <a href="/admin/seo/clusters" class="seo-quick-link">
      <span class="seo-quick-link__icon">🔑</span><span>Keyword Clusters</span>
    </a>
    <a href="/admin/seo/pages" class="seo-quick-link">
      <span class="seo-quick-link__icon">📄</span><span>Page Profiles</span>
    </a>
    <a href="/admin/seo/issues" class="seo-quick-link">
      <span class="seo-quick-link__icon">⚠️</span><span>Issues & Revisions</span>
    </a>
  </div>
</div>

<style>
  .seo-dash {
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .seo-dash__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-1);
  }

  .seo-dash__subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  /* ── Wizard ───────────────────────────────────── */
  .wizard {
    background: rgba(26, 26, 46, 0.03);
    border: 1px solid rgba(26, 26, 46, 0.14);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .wizard__chat {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .chat-msg {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .chat-msg--user { flex-direction: row-reverse; }

  .chat-avatar {
    width: 32px;
    height: 32px;
    background: #1a1a2e;
    color: #c9b97a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .chat-bubble {
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text);
    line-height: 1.6;
    max-width: 580px;
  }

  .chat-msg--user .chat-bubble {
    background: #1a1a2e;
    border-color: #1a1a2e;
    color: #fff;
  }

  .chat-bubble p { margin: 0 0 var(--space-2); }
  .chat-bubble p:last-child { margin: 0; }

  .wizard__actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .btn-wizard-primary {
    background: #1a1a2e;
    color: #c9b97a;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .btn-wizard-primary:hover:not(:disabled) { opacity: 0.85; }
  .btn-wizard-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-wizard-skip {
    background: none;
    border: none;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0;
  }
  .btn-wizard-skip:hover { color: var(--color-text); }

  .wizard__spinner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border);
    border-top-color: #1a1a2e;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .wizard-error {
    font-size: var(--text-xs);
    color: #e5484d;
    margin: 0;
  }

  .wizard__review {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .wizard__review-label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .suggestion-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-3);
  }

  .suggestion-card {
    background: #fff;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    cursor: pointer;
    transition: border-color var(--transition-fast), opacity var(--transition-fast);
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .suggestion-card input[type="checkbox"] {
    margin-top: 3px;
    flex-shrink: 0;
    accent-color: #1a1a2e;
  }

  .suggestion-card:hover { border-color: #1a1a2e; }
  .suggestion-card--off { opacity: 0.4; }

  .suggestion-card__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .suggestion-card__top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-2);
  }

  .suggestion-name {
    font-weight: 700;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .suggestion-intent {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  .suggestion-primary {
    font-size: var(--text-sm);
    color: var(--color-accent);
    font-weight: 600;
  }

  .suggestion-terms {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }

  .term-chip {
    font-size: 10px;
    background: #f0f4ff;
    border: 1px solid #c7d3f5;
    border-radius: 3px;
    padding: 1px 5px;
    color: #3a5bc7;
  }

  .term-chip--more {
    background: #f5f5f5;
    border-color: var(--color-border);
    color: var(--color-text-muted);
  }

  .suggestion-reason {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: var(--space-1) 0 0;
    line-height: 1.4;
  }

  /* ── KPI strip ────────────────────────────────── */
  .seo-kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }

  .seo-kpi {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .seo-kpi__value {
    font-size: var(--text-3xl);
    font-weight: 800;
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
    color: var(--color-accent);
  }

  .seo-kpi__label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .score--good   { color: #22a06b; }
  .score--medium { color: #d97706; }
  .score--poor   { color: #e5484d; }

  .seo-dash__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .seo-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }

  .seo-card__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .seo-card__title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .seo-card__link {
    font-size: var(--text-sm);
    color: var(--color-accent);
    text-decoration: none;
  }

  .seo-empty { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; }

  .seo-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }

  .seo-table th {
    text-align: left;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 0 0 var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  .seo-table td {
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    vertical-align: middle;
  }

  .seo-table tr:last-child td { border-bottom: none; }

  .seo-route { font-size: var(--text-xs); font-family: monospace; color: var(--color-text); margin-right: var(--space-1); }

  .seo-badge {
    font-size: 10px;
    background: var(--color-bg-soft, #f5f5f5);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 5px;
    color: var(--color-text-muted);
  }

  .score { font-weight: 700; font-size: var(--text-sm); }
  .seo-date { font-size: var(--text-xs); color: var(--color-text-muted); }

  .seo-audit-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }

  .seo-audit-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .seo-audit-item:last-child { border-bottom: none; }

  .seo-audit-route { flex: 1; font-size: var(--text-xs); font-family: monospace; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .seo-ai-badge { font-size: 10px; background: #fff8ed; border: 1px solid #fad59a; border-radius: 4px; padding: 1px 5px; color: #b45309; }

  .seo-quick-links { display: flex; gap: var(--space-3); }

  .seo-quick-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text);
    text-decoration: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .seo-quick-link:hover {
    border-color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  @media (max-width: 900px) {
    .seo-kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .seo-dash__grid { grid-template-columns: 1fr; }
    .seo-quick-links { flex-direction: column; }
    .suggestion-grid { grid-template-columns: 1fr; }
  }
  .seo-card__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .seo-lead-audit-btn {
    font-size: var(--text-xs);
    font-weight: 600;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
  }
  .seo-lead-audit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .seo-lead-audit-msg {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-2);
  }
</style>
