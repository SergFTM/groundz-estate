<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function scoreClass(score: number | null): string {
    if (score == null) return '';
    if (score >= 80) return 'score--good';
    if (score >= 50) return 'score--medium';
    return 'score--poor';
  }

  function formatDate(d: string | Date | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
</script>

<div class="seo-pages">
  <div class="seo-pages__header">
    <h1 class="seo-pages__title">Page Profiles</h1>
    <p class="seo-pages__sub">{data.profiles.length} pages tracked</p>
  </div>

  {#if data.profiles.length === 0}
    <div class="seo-empty-state">
      <p>No page profiles yet. Trigger <code>POST /api/seo/audit-page</code> to create one.</p>
    </div>
  {:else}
    <div class="seo-table-wrap">
      <table class="seo-table">
        <thead>
          <tr>
            <th>Route / Article</th>
            <th>Type</th>
            <th>Locale</th>
            <th>Cluster</th>
            <th>Score</th>
            <th>Last Audit</th>
            <th>AI Run</th>
          </tr>
        </thead>
        <tbody>
          {#each data.profiles as p}
            <tr>
              <td class="td-route">
                {#if p.route}
                  <a href={p.route} target="_blank" class="route-link">{p.route}</a>
                {:else}
                  <span class="route-article">article:{p.articleId?.slice(0,8) ?? '—'}</span>
                {/if}
              </td>
              <td><span class="badge">{p.pageType}</span></td>
              <td>{p.locale}</td>
              <td>{p.primaryCluster?.name ?? '—'}</td>
              <td>
                <span class="score {scoreClass(p.seoScore)}">{p.seoScore ?? '—'}</span>
              </td>
              <td class="td-date">{formatDate(p.lastAuditAt)}</td>
              <td class="td-date">{formatDate(p.lastAiRunAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .seo-pages {
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .seo-pages__title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-1);
  }

  .seo-pages__sub {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .seo-empty-state {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .seo-empty-state code {
    background: var(--color-bg-soft, #f5f5f5);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .seo-table-wrap {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow-x: auto;
  }

  .seo-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .seo-table th {
    text-align: left;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .seo-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    vertical-align: middle;
  }

  .seo-table tr:last-child td { border-bottom: none; }

  .td-route { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .route-link {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-accent);
    text-decoration: none;
  }
  .route-link:hover { text-decoration: underline; }
  .route-article { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }

  .badge {
    font-size: 10px;
    background: var(--color-bg-soft, #f5f5f5);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 5px;
    color: var(--color-text-muted);
  }

  .score { font-weight: 700; }
  .score--good { color: #22a06b; }
  .score--medium { color: #d97706; }
  .score--poor { color: #e5484d; }

  .td-date { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; }
</style>
