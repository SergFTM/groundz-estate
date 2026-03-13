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
    tourImages?: string | null;
    ontourtrigger?: (code: string) => void;
  }

  let { code, type, bedrooms, floor, areaSqm, price, status, tourImages }: Props = $props();

  let hasTour = $derived(!!tourImages && tourImages !== '[]');

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
  <div class="unit-card__bg" aria-hidden="true"></div>

  <div class="unit-card__header">
    <span class="unit-card__code">{code}</span>
    <div class="unit-card__badges">
      {#if hasTour}
        <span class="unit-card__tour-badge">
          <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Tour
        </span>
      {/if}
      <StatusBadge {status} />
    </div>
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
    background: linear-gradient(160deg, #faf8f4 0%, #f2efe7 45%, #f7f5ef 100%);
    border: 1px solid rgba(180, 170, 148, 0.3);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    position: relative;
    overflow: hidden;
    transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-fast);
  }

  .unit-card:hover {
    border-color: rgba(122, 140, 110, 0.4);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
  }

  .unit-card--unavailable {
    opacity: 0.55;
  }

  /* Subtle architectural floor-line texture */
  .unit-card__bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: repeating-linear-gradient(
      to top,
      transparent 0px,
      transparent 7px,
      rgba(122, 140, 110, 0.055) 7px,
      rgba(122, 140, 110, 0.055) 8px
    );
    pointer-events: none;
  }

  /* Warm accent glow at base */
  .unit-card::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 65%;
    height: 24px;
    background: radial-gradient(ellipse, rgba(122, 140, 110, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .unit-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    position: relative;
    z-index: 1;
  }

  .unit-card__badges {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .unit-card__code {
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text);
    font-family: monospace;
    letter-spacing: 0.04em;
  }

  .unit-card__tour-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--color-accent);
    background: rgba(122, 140, 110, 0.1);
    border: 1px solid rgba(122, 140, 110, 0.25);
    padding: 2px 6px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  .unit-card__type {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-body);
    position: relative;
    z-index: 1;
  }

  .unit-card__details {
    display: flex;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    position: relative;
    z-index: 1;
  }

  .unit-card__price {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
    position: relative;
    z-index: 1;
    margin-top: var(--space-1);
  }
</style>
