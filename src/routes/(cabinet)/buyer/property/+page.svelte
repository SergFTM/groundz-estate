<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatters';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import DetailCard from '$lib/components/cabinet/DetailCard.svelte';

  let { data } = $props();
</script>

<div class="property-page">
  <h1 class="page-title">My Property</h1>

  {#if data.units.length > 0}
    <div class="units-list">
      {#each data.units as unit}
        <DetailCard
          title={unit.project?.name ?? 'Property'}
          subtitle="Unit {unit.code}"
        >
          <div class="unit-details">
            <div class="unit-details__grid">
              <div class="unit-details__item">
                <span class="unit-details__label">Unit Code</span>
                <span class="unit-details__value">{unit.code}</span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Type</span>
                <span class="unit-details__value">{unit.type}</span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Bedrooms</span>
                <span class="unit-details__value">{unit.bedrooms ?? '—'}</span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Floor</span>
                <span class="unit-details__value">{unit.floor ?? '—'}</span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Area</span>
                <span class="unit-details__value">{unit.areaSqm ? `${unit.areaSqm} m²` : '—'}</span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Price</span>
                <span class="unit-details__value">{unit.price ? formatCurrency(unit.price) : '—'}</span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Status</span>
                <span class="unit-details__value"><StatusBadge status={unit.status} /></span>
              </div>
              <div class="unit-details__item">
                <span class="unit-details__label">Project</span>
                <span class="unit-details__value">{unit.project?.name ?? '—'}</span>
              </div>
            </div>
          </div>
        </DetailCard>
      {/each}
    </div>
  {:else}
    <div class="empty-card">
      <p class="empty-card__text">No property units found. Contact your manager for more information.</p>
    </div>
  {/if}
</div>

<style>
  .property-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 900px;
  }

  .page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
  }

  .units-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .unit-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .unit-details__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4) var(--space-8);
  }

  .unit-details__item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .unit-details__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .unit-details__value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .empty-card {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-12) var(--space-8);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-card__text {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }

  @media (max-width: 600px) {
    .unit-details__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
