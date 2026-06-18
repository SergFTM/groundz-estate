<script lang="ts">
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

  let progressPercent = $derived(goalAmount > 0 ? Math.min(100, Math.round((raisedAmount / goalAmount) * 100)) : 0);

  function formatAmount(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    return `€${Math.round(n / 1000)}k`;
  }

  const statusLabel: Record<string, string> = {
    active: 'Active',
    coming_soon: 'Coming Soon',
    closed: 'Closed',
    on_hold: 'On Hold',
  };
</script>

<div class="inv-card">
  <!-- Header -->
  <div class="inv-card__header">
    <div>
      <h3 class="inv-card__name">{name}</h3>
      <div class="inv-card__project">{projectName}</div>
    </div>
    <span class="inv-card__status">{statusLabel[status] ?? status}</span>
  </div>

  <!-- Yield -->
  <div class="inv-card__yield">
    <span class="inv-card__yield-value">{targetYield}%</span>
    <span class="inv-card__yield-suffix">p.a.</span>
    <span class="inv-card__yield-label">target yield</span>
  </div>

  <!-- Progress -->
  <div class="inv-card__progress">
    <ProgressBar value={progressPercent} showPercent={false} />
    <div class="inv-card__progress-row">
      <span>{formatAmount(raisedAmount)} raised</span>
      <span>{progressPercent}% · of {formatAmount(goalAmount)}</span>
    </div>
  </div>

  {#if description}
    <p class="inv-card__desc">{description}</p>
  {/if}

  <!-- CTA -->
  <a href="/contact" class="inv-card__cta">Learn More →</a>
</div>

<style>
  .inv-card {
    background: linear-gradient(
      to bottom,
      #2a2825 0%,
      #33302c 60%,
      #3d3830 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 24px 24px 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .inv-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  }

  /* ── Header ── */
  .inv-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .inv-card__name {
    font-family: 'Ivyora Display', Georgia, 'Times New Roman', serif;
    font-weight: 300;
    font-style: italic;
    font-size: 1.35rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 4px;
    line-height: 1.2;
  }

  .inv-card__project {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
  }

  .inv-card__status {
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-accent);
    background: rgba(122, 140, 110, 0.12);
    border: 1px solid rgba(122, 140, 110, 0.25);
    padding: 4px 9px;
    border-radius: 4px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  /* ── Yield ── */
  .inv-card__yield {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .inv-card__yield-value {
    font-family: 'Ivyora Display', Georgia, 'Times New Roman', serif;
    font-weight: 300;
    font-style: italic;
    font-size: 2.4rem;
    color: #fff;
    line-height: 1;
  }

  .inv-card__yield-suffix {
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 2px;
  }

  .inv-card__yield-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-accent);
    margin-left: 6px;
    margin-bottom: 2px;
  }

  /* ── Progress ── */
  .inv-card__progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .inv-card__progress-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 0.02em;
  }

  /* ── Description ── */
  .inv-card__desc {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── CTA ── */
  .inv-card__cta {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-accent);
    text-decoration: none;
    margin-top: auto;
    transition: letter-spacing 0.2s;
  }

  .inv-card:hover .inv-card__cta {
    letter-spacing: 0.15em;
  }
</style>
