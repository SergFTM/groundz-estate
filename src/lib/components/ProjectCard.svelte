<script lang="ts">
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

  const statusLabel: Record<string, string> = {
    active: 'Active',
    coming_soon: 'Coming Soon',
    sold_out: 'Sold Out',
    on_hold: 'On Hold',
  };
</script>

<a href="/projects/{slug}" class="project-card">
  <!-- Image -->
  <div class="project-card__image">
    <img
      src={imageUrl ?? '/images/projects/placeholder.svg'}
      alt={name}
    />
    <span class="project-card__status">{statusLabel[status] ?? status}</span>
  </div>

  <!-- Body -->
  <div class="project-card__body">
    <div class="project-card__top">
      <span class="project-card__location">{location}</span>
      <span class="project-card__units">{unitCount} units</span>
    </div>
    <h3 class="project-card__name">{name}</h3>
    <div class="project-card__footer">
      {#if priceFrom != null}
        <div class="project-card__price-wrap">
          <span class="project-card__price-label">From</span>
          <span class="project-card__price">{formatPrice(priceFrom)}</span>
        </div>
      {:else}
        <div></div>
      {/if}
      <span class="project-card__cta">View →</span>
    </div>
  </div>
</a>

<style>
  .project-card {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-dark-card, #2a2825);
    border-radius: 12px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .project-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4);
  }

  /* ── Image ── */
  .project-card__image {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    flex-shrink: 0;
  }

  .project-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(0.8) saturate(0.9);
    transition: transform 0.5s ease, filter 0.4s ease;
  }

  .project-card:hover .project-card__image img {
    transform: scale(1.05);
    filter: brightness(0.9) saturate(1);
  }

  /* ── Status badge ── */
  .project-card__status {
    position: absolute;
    top: 14px;
    right: 14px;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 5px 10px;
    border-radius: 4px;
  }

  /* ── Body ── */
  .project-card__body {
    padding: 20px 22px 20px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .project-card__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .project-card__location {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
  }

  .project-card__units {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .project-card__name {
    font-family: 'Ivyora Display', Georgia, 'Times New Roman', serif;
    font-weight: 300;
    font-style: italic;
    font-size: clamp(1.3rem, 2vw, 1.6rem);
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.2;
    margin: 0 0 20px;
  }

  /* ── Footer ── */
  .project-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin-top: auto;
  }

  .project-card__price-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .project-card__price-label {
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
  }

  .project-card__price {
    font-family: 'Ivyora Display', Georgia, 'Times New Roman', serif;
    font-weight: 300;
    font-style: italic;
    font-size: 1.35rem;
    color: #fff;
    line-height: 1;
  }

  .project-card__cta {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-accent);
    transition: letter-spacing 0.2s;
  }

  .project-card:hover .project-card__cta {
    letter-spacing: 0.15em;
  }
</style>
