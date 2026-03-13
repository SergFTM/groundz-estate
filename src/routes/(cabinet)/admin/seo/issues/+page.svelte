<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  let { data }: { data: PageData } = $props();

  type Tab = 'revisions' | 'audits';
  let activeTab = $state<Tab>('revisions');

  function formatDate(d: string | Date): string {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function parseIssues(json: string): { code: string; severity: string; message: string }[] {
    try { return JSON.parse(json); } catch { return []; }
  }

  function severityClass(s: string): string {
    if (s === 'critical') return 'sev--critical';
    if (s === 'high') return 'sev--high';
    if (s === 'medium') return 'sev--medium';
    return 'sev--low';
  }
</script>

<div class="issues">
  <div class="issues__header">
    <h1 class="issues__title">Issues & Revisions</h1>
  </div>

  <div class="tabs">
    <button class="tab" class:tab--active={activeTab === 'revisions'} onclick={() => activeTab = 'revisions'}>
      Content Revisions ({data.revisions.length})
    </button>
    <button class="tab" class:tab--active={activeTab === 'audits'} onclick={() => activeTab = 'audits'}>
      Audit Log ({data.recentAudits.length})
    </button>
  </div>

  {#if activeTab === 'revisions'}
    {#if data.revisions.length === 0}
      <div class="empty-state">No pending revisions.</div>
    {:else}
      <div class="revision-list">
        {#each data.revisions as rev}
          <div class="revision-card">
            <div class="revision-card__meta">
              <span class="rev-route">{rev.pageProfile?.route ?? rev.pageProfile?.articleId?.slice(0,8) ?? '—'}</span>
              <span class="rev-type">{rev.changeType}</span>
              <span class="rev-status rev-status--{rev.status}">{rev.status}</span>
              <span class="rev-date">{formatDate(rev.createdAt)}</span>
            </div>
            <div class="revision-card__diff">
              <div class="diff-block diff-block--original">
                <span class="diff-label">Original</span>
                <p>{rev.originalText}</p>
              </div>
              <div class="diff-block diff-block--proposed">
                <span class="diff-label">Proposed</span>
                <p>{rev.proposedText}</p>
              </div>
            </div>
            {#if rev.status === 'pending'}
              <div class="revision-card__actions">
                <form method="POST" action="?/updateRevision" use:enhance>
                  <input type="hidden" name="id" value={rev.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button type="submit" class="btn-approve">Approve</button>
                </form>
                <form method="POST" action="?/updateRevision" use:enhance>
                  <input type="hidden" name="id" value={rev.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit" class="btn-reject">Reject</button>
                </form>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    {#if data.recentAudits.length === 0}
      <div class="empty-state">No audits yet.</div>
    {:else}
      <div class="audit-log">
        {#each data.recentAudits as audit}
          {@const issues = parseIssues(audit.issuesJson)}
          <div class="audit-row">
            <span class="audit-route">{audit.pageProfile?.route ?? '—'}</span>
            <span class="audit-score" class:score--good={audit.score >= 80} class:score--medium={audit.score >= 50 && audit.score < 80} class:score--poor={audit.score < 50}>
              {Math.round(audit.score)}
            </span>
            <div class="audit-issues">
              {#each issues.slice(0, 4) as issue}
                <span class="issue-chip {severityClass(issue.severity)}">{issue.code}</span>
              {/each}
              {#if issues.length > 4}
                <span class="issue-more">+{issues.length - 4}</span>
              {/if}
            </div>
            <span class="audit-date">{formatDate(audit.createdAt)}</span>
            {#if !audit.aiAvailable}
              <span class="ai-badge">rule-only</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .issues {
    max-width: 1000px;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .issues__title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .tabs {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0;
  }

  .tab {
    background: none;
    border: none;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all var(--transition-fast);
  }

  .tab--active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
    font-weight: 600;
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

  /* Revisions */
  .revision-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .revision-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .revision-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .rev-route {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text);
    flex: 1;
  }

  .rev-type, .rev-status, .rev-date {
    font-size: var(--text-xs);
  }

  .rev-status { font-weight: 600; text-transform: uppercase; }
  .rev-status--pending { color: #d97706; }
  .rev-status--approved { color: #22a06b; }
  .rev-status--rejected { color: #e5484d; }
  .rev-status--applied { color: #3a5bc7; }
  .rev-date { color: var(--color-text-muted); }

  .revision-card__diff {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .diff-block {
    border-radius: var(--radius-md);
    padding: var(--space-3);
    font-size: var(--text-sm);
  }

  .diff-block--original { background: #fff5f5; border: 1px solid #fcc; }
  .diff-block--proposed { background: #f0fff4; border: 1px solid #9de; }

  .diff-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: var(--space-1);
    color: var(--color-text-muted);
  }

  .diff-block p { margin: 0; line-height: 1.5; color: var(--color-text); }

  .revision-card__actions {
    display: flex;
    gap: var(--space-2);
  }

  .btn-approve {
    background: #22a06b;
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .btn-reject {
    background: none;
    border: 1px solid #e5484d;
    color: #e5484d;
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  /* Audit log */
  .audit-log {
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .audit-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }

  .audit-row:last-child { border-bottom: none; }

  .audit-route {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text);
    min-width: 160px;
    flex: 1;
  }

  .audit-score {
    font-weight: 700;
    font-size: var(--text-sm);
    min-width: 32px;
  }

  .score--good { color: #22a06b; }
  .score--medium { color: #d97706; }
  .score--poor { color: #e5484d; }

  .audit-issues {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 2;
  }

  .issue-chip {
    font-size: 10px;
    border-radius: 4px;
    padding: 1px 5px;
    font-weight: 600;
  }

  .sev--critical { background: #ffe4e6; color: #9f1239; }
  .sev--high     { background: #ffedd5; color: #9a3412; }
  .sev--medium   { background: #fef9c3; color: #92400e; }
  .sev--low      { background: #f0fdf4; color: #166534; }

  .issue-more {
    font-size: 10px;
    color: var(--color-text-muted);
    align-self: center;
  }

  .audit-date {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .ai-badge {
    font-size: 10px;
    background: #fff8ed;
    border: 1px solid #fad59a;
    border-radius: 4px;
    padding: 1px 5px;
    color: #b45309;
  }

  @media (max-width: 700px) {
    .revision-card__diff { grid-template-columns: 1fr; }
  }
</style>
