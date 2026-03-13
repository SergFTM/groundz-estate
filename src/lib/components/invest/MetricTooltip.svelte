<script lang="ts">
  interface Props {
    metric: string;
    value: string;
    poolContext: Record<string, unknown> | null;
    small?: boolean;
  }

  let { metric, value, poolContext, small = false }: Props = $props();

  let open = $state(false);
  let loading = $state(false);
  let explanation = $state<string | null>(null);

  async function fetchExplanation() {
    if (explanation) { open = !open; return; }
    open = true;
    loading = true;
    try {
      const res = await fetch('/api/invest/metric-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, value, poolContext }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      explanation = data.explanation;
    } catch {
      explanation = 'Explanation unavailable. Please try again.';
    } finally {
      loading = false;
    }
  }

  function closeOnOutside(e: MouseEvent) {
    if (open && !(e.target as Element).closest('.metric-tooltip')) {
      open = false;
    }
  }
</script>

<svelte:window onclick={closeOnOutside} />

<div class="metric-tooltip" class:metric-tooltip--small={small}>
  <button
    class="metric-tooltip__btn"
    onclick={fetchExplanation}
    title="Explain this metric"
    aria-label="Explain {metric}"
  >?</button>

  {#if open}
    <div class="metric-tooltip__popover">
      {#if loading}
        <p class="metric-tooltip__loading">Loading explanation…</p>
      {:else if explanation}
        <p class="metric-tooltip__text">{explanation}</p>
      {/if}
      <button class="metric-tooltip__close" onclick={() => open = false}>×</button>
    </div>
  {/if}
</div>

<style>
  .metric-tooltip { position: relative; display: inline-flex; align-items: center; }

  .metric-tooltip__btn {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: rgba(180,140,90,0.15);
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
    font-size: 9px; font-weight: 800;
    cursor: pointer; padding: 0;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background var(--transition-fast);
    flex-shrink: 0;
  }
  .metric-tooltip__btn:hover { background: rgba(180,140,90,0.3); }
  .metric-tooltip--small .metric-tooltip__btn { width: 13px; height: 13px; font-size: 8px; }

  .metric-tooltip__popover {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    width: 260px;
    background: #1a1a1a;
    color: #fff;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .metric-tooltip__popover::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #1a1a1a;
  }

  .metric-tooltip__text {
    font-size: 12px; line-height: 1.55; margin: 0; color: rgba(255,255,255,0.88);
  }
  .metric-tooltip__loading {
    font-size: 12px; color: rgba(255,255,255,0.6); margin: 0; font-style: italic;
  }
  .metric-tooltip__close {
    position: absolute; top: 6px; right: 8px;
    background: none; border: none; color: rgba(255,255,255,0.5);
    font-size: 14px; cursor: pointer; padding: 0; line-height: 1;
  }
  .metric-tooltip__close:hover { color: #fff; }
</style>
