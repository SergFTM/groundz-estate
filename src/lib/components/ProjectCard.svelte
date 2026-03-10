<script lang="ts">
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';

  interface Props {
    name: string;
    slug: string;
    location: string;
    status: string;
    imageUrl?: string | null;
    unitCount: number;
    priceFrom?: number | null;
  }

  let { name, slug, location, status, imageUrl, unitCount, priceFrom }: Props = $props();

  function formatPrice(p: number): string {
    if (p >= 1_000_000) return `€${(p / 1_000_000).toFixed(1)}M`;
    if (p >= 1000) return `€${Math.round(p / 1000)}k`;
    return `€${p}`;
  }
</script>

<div class="project-card">
  <div class="project-card__image">
    {#if imageUrl}
      <img src={imageUrl} alt={name} />
    {:else}
      <img src="/images/projects/placeholder.svg" alt={name} />
    {/if}
    <div class="project-card__badge">
      <StatusBadge {status} />
    </div>
  </div>
  <div class="project-card__body">
    <div class="project-card__location">{location}</div>
    <h3 class="project-card__name">{name}</h3>
    <div class="project-card__meta">
      {#if priceFrom}
        <span class="project-card__price">From {formatPrice(priceFrom)}</span>
      {/if}
      <span class="project-card__units">{unitCount} units</span>
    </div>
    <a href="/projects/{slug}" class="project-card__link">View Project →</a>
  </div>
</div>

<style>
  .project-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow var(--transition-base);
  }

  .project-card:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .project-card__image {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--color-bg-alt);
  }

  .project-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .project-card__badge {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
  }

  .project-card__body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .project-card__location {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .project-card__name {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .project-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .project-card__price {
    font-weight: 700;
    color: var(--color-accent);
  }

  .project-card__link {
    display: inline-block;
    margin-top: auto;
    padding-top: var(--space-3);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
  }

  .project-card__link:hover {
    text-decoration: underline;
  }
</style>
