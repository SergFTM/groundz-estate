<script lang="ts">
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

  interface Props {
    name: string;
    projectName: string;
    status: string;
    goalAmount: number;
    raisedAmount: number;
    targetYield: number;
    description?: string | null;
  }

  let { name, projectName, status, goalAmount, raisedAmount, targetYield, description }: Props = $props();

  let progressPercent = $derived(Math.min(100, Math.round((raisedAmount / goalAmount) * 100)));

  function formatAmount(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    return `€${Math.round(n / 1000)}k`;
  }
</script>

<div class="investment-card">
  <div class="investment-card__header">
    <div>
      <h3 class="investment-card__name">{name}</h3>
      <div class="investment-card__project">{projectName}</div>
    </div>
    <StatusBadge {status} />
  </div>

  <div class="investment-card__yield">
    <span class="investment-card__yield-value">{targetYield}% p.a.</span>
    <span class="investment-card__yield-label">target yield</span>
  </div>

  <div class="investment-card__progress">
    <ProgressBar value={progressPercent} showPercent={false} />
    <div class="investment-card__progress-label">
      <span>{formatAmount(raisedAmount)} raised</span>
      <span>of {formatAmount(goalAmount)} goal</span>
    </div>
  </div>

  {#if description}
    <p class="investment-card__desc">{description}</p>
  {/if}

  <a href="/contact" class="investment-card__link">Learn More →</a>
</div>

<style>
  .investment-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    transition: box-shadow var(--transition-base);
  }

  .investment-card:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .investment-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .investment-card__name {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-1);
  }

  .investment-card__project {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .investment-card__yield {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .investment-card__yield-value {
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
  }

  .investment-card__yield-label {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .investment-card__progress-label {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }

  .investment-card__desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .investment-card__link {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
    margin-top: auto;
  }

  .investment-card__link:hover {
    text-decoration: underline;
  }
</style>
