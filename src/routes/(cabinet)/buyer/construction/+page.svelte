<script lang="ts">
  import ConstructionTimeline from '$lib/components/cabinet/ConstructionTimeline.svelte';

  let { data } = $props();
</script>

<div class="construction-page">
  <h1 class="page-title">Construction</h1>

  {#if data.unit && data.phases.length > 0}
    <div class="construction-header">
      <div class="construction-header__project">
        <span class="construction-header__label">Project</span>
        <span class="construction-header__value">{data.unit.project?.name ?? '—'}</span>
      </div>
      <div class="construction-header__unit">
        <span class="construction-header__label">Unit</span>
        <span class="construction-header__value">{data.unit.code}</span>
      </div>
    </div>

    <ConstructionTimeline phases={data.phases} />
  {:else}
    <div class="empty-card">
      {#if !data.unit}
        <p class="empty-card__text">No property assigned yet. Contact your manager for more information.</p>
      {:else}
        <p class="empty-card__text">No construction phases have been added yet. Check back later for updates.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .construction-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 800px;
  }

  .page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
  }

  .construction-header {
    display: flex;
    gap: var(--space-8);
    padding: var(--space-4) var(--space-6);
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
  }

  .construction-header__project,
  .construction-header__unit {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .construction-header__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .construction-header__value {
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
</style>
