<script lang="ts">
  interface Props {
    score: number | null;
    loading?: boolean;
  }
  let { score, loading = false }: Props = $props();

  const SIZE = 80;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  let dashOffset = $derived(
    score == null ? CIRC : CIRC - (score / 100) * CIRC
  );

  function colorClass(s: number): string {
    if (s >= 80) return 'good';
    if (s >= 50) return 'medium';
    return 'poor';
  }
</script>

<div class="seo-score">
  {#if loading}
    <div class="seo-score__spinner"></div>
  {:else}
    <svg width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}" class="seo-score__svg">
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none" stroke="var(--color-border)"
        stroke-width={STROKE}
      />
      {#if score != null}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke-width={STROKE}
          stroke-linecap="round"
          stroke-dasharray={CIRC}
          stroke-dashoffset={dashOffset}
          transform="rotate(-90 {SIZE/2} {SIZE/2})"
          class="seo-score__arc seo-score__arc--{colorClass(score)}"
        />
      {/if}
      <text
        x="50%" y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        class="seo-score__text {score != null ? 'seo-score__text--' + colorClass(score) : ''}"
      >{score ?? '—'}</text>
    </svg>
    <span class="seo-score__label">SEO Score</span>
  {/if}
</div>

<style>
  .seo-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .seo-score__svg { display: block; }

  .seo-score__arc {
    transition: stroke-dashoffset 0.6s ease;
  }
  .seo-score__arc--good   { stroke: #22a06b; }
  .seo-score__arc--medium { stroke: #d97706; }
  .seo-score__arc--poor   { stroke: #e5484d; }

  .seo-score__text {
    font-size: 20px;
    font-weight: 800;
    font-family: 'IvyoraDisplay', serif;
    fill: var(--color-text);
  }
  .seo-score__text--good   { fill: #22a06b; }
  .seo-score__text--medium { fill: #d97706; }
  .seo-score__text--poor   { fill: #e5484d; }

  .seo-score__label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .seo-score__spinner {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 7px solid var(--color-border);
    border-top-color: var(--color-accent);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
</style>
