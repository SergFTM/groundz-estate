<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    actions?: Snippet;
    children: Snippet;
  }

  let { title, subtitle, actions, children }: Props = $props();
</script>

<div class="detail-card">
  <div class="detail-card__header">
    <div>
      <h2 class="detail-card__title">{title}</h2>
      {#if subtitle}
        <p class="detail-card__subtitle">{subtitle}</p>
      {/if}
    </div>
    {#if actions}
      <div class="detail-card__actions">
        {@render actions()}
      </div>
    {/if}
  </div>
  <div class="detail-card__body">
    {@render children()}
  </div>
</div>

<style>
  .detail-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .detail-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--space-6) var(--space-8);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .detail-card__title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
  }

  .detail-card__subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }

  .detail-card__actions {
    display: flex;
    gap: var(--space-3);
  }

  .detail-card__body {
    padding: var(--space-6) var(--space-8);
  }
</style>
