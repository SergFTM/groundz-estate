<script lang="ts">
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  interface Props {
    code: string;
    type: string;
    bedrooms: number;
    floor: number;
    areaSqm: number;
    price?: number | null;
    status: string;
  }

  let { code, type, bedrooms, floor, areaSqm, price, status }: Props = $props();

  let typeLabel = $derived(
    type === 'studio' ? 'Studio' :
    type === 'penthouse' ? 'Penthouse' :
    `${bedrooms}-Bed`
  );

  function formatPrice(p: number): string {
    if (p >= 1_000_000) return `€${(p / 1_000_000).toFixed(2)}M`;
    return `€${p.toLocaleString('en-EU')}`;
  }
</script>

<div class="unit-card" class:unit-card--unavailable={status !== 'available'}>
  <div class="unit-card__header">
    <span class="unit-card__code">{code}</span>
    <StatusBadge {status} />
  </div>
  <div class="unit-card__type">{typeLabel}</div>
  <div class="unit-card__details">
    <span>Floor {floor}</span>
    <span>{areaSqm}m²</span>
  </div>
  {#if price != null}
    <div class="unit-card__price">{formatPrice(price)}</div>
  {/if}
</div>

<style>
  .unit-card {
    background: rgba(122, 140, 110, 0.06);
    border: 1px solid rgba(122, 140, 110, 0.15);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .unit-card--unavailable {
    opacity: 0.6;
  }

  .unit-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .unit-card__code {
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text);
    font-family: monospace;
  }

  .unit-card__type {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .unit-card__details {
    display: flex;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .unit-card__price {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
  }
</style>
