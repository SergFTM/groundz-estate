<script lang="ts">
  import type { SeoIssue } from '../types/seoTypes.js';

  interface Props {
    issues: SeoIssue[];
  }
  let { issues }: Props = $props();

  const ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  let sorted = $derived([...issues].sort((a, b) => (ORDER[a.severity] ?? 9) - (ORDER[b.severity] ?? 9)));
</script>

<div class="issue-list">
  {#if issues.length === 0}
    <p class="issue-list__empty">No issues found.</p>
  {:else}
    {#each sorted as issue}
      <div class="issue-row issue-row--{issue.severity}">
        <span class="issue-badge issue-badge--{issue.severity}">{issue.severity}</span>
        <span class="issue-msg">{issue.message}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  .issue-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .issue-list__empty {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  .issue-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: 4px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .issue-row:last-child { border-bottom: none; }

  .issue-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: 3px;
    padding: 2px 5px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .issue-badge--critical { background: #ffe4e6; color: #9f1239; }
  .issue-badge--high     { background: #ffedd5; color: #9a3412; }
  .issue-badge--medium   { background: #fef9c3; color: #92400e; }
  .issue-badge--low      { background: #f0fdf4; color: #166534; }

  .issue-msg {
    font-size: var(--text-xs);
    color: var(--color-text);
    line-height: 1.4;
  }
</style>
