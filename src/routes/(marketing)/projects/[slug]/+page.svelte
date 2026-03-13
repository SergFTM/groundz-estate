<script lang="ts">
  import UnitCard from '$lib/components/UnitCard.svelte';
  import FloorTourViewer from '$lib/components/FloorTourViewer.svelte';
  import ProjectTourSection from '$lib/components/ProjectTourSection.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ConstructionTimeline from '$lib/components/cabinet/ConstructionTimeline.svelte';
  import AIChatWidget from '$lib/components/AIChatWidget.svelte';

  interface TourImage { url: string; label: string }

  let { data } = $props();
  let { project } = $derived(data);

  let heroEl = $state<HTMLElement | null>(null);
  let heroBgY = $state(0);

  $effect(() => {
    function onScroll() {
      if (!heroEl) return;
      heroBgY = -heroEl.getBoundingClientRect().top * 0.38;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  let tourUnit = $state<{ code: string; images: TourImage[]; floorPlanImage?: string } | null>(null);

  function openTour(code: string) {
    const unit = project.units.find((u) => u.code === code);
    if (!unit?.tourImages) return;
    try {
      const images: TourImage[] = JSON.parse(unit.tourImages);
      if (images.length) tourUnit = {
        code,
        images,
        floorPlanImage: (unit as { tourFloorPlan?: string }).tourFloorPlan ?? undefined,
      };
    } catch { /* invalid JSON — skip */ }
  }

  let availableUnits = $derived(project.units.filter((u) => u.status === 'available'));

  let priceFrom = $derived(
    availableUnits.reduce((min: number | null, u) => {
      if (u.price === null || u.price === undefined) return min;
      return min === null ? u.price : Math.min(min, u.price);
    }, null)
  );

  let deliveryDate = $derived.by(() => {
    const withEnd = project.constructionPhases
      .filter((p) => p.endDate)
      .sort((a, b) => new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime());
    if (!withEnd.length) return 'TBD';
    const d = new Date(withEnd[0].endDate!);
    return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
  });

  function formatPrice(p: number): string {
    if (p >= 1_000_000) return `€${(p / 1_000_000).toFixed(1)}M`;
    return `€${Math.round(p / 1000)}k`;
  }
</script>

<svelte:head>
  <title>{project.name} — Develta</title>
  <meta name="description" content={project.description ?? `${project.name} — premium residential development in ${project.location}`} />
</svelte:head>

<!-- Hero with parallax -->
<section class="hero" bind:this={heroEl}>
  <div
    class="hero__bg"
    style="transform: translateY({heroBgY}px); {project.imageUrl ? `background-image: url(${project.imageUrl})` : ''}"
  ></div>
  <div class="hero__overlay">
    <div class="hero__content">
      <StatusBadge status={project.status} />
      <h1 class="hero__title">{project.name}</h1>
      <p class="hero__location">{project.location}</p>
      {#if priceFrom != null}
        <p class="hero__price">From {formatPrice(priceFrom)}</p>
      {/if}
    </div>
  </div>
</section>

<!-- KPI Strip -->
<div class="kpi-strip">
  <div class="kpi-item">
    <strong>{priceFrom != null ? formatPrice(priceFrom) : '—'}</strong>
    <span>from</span>
  </div>
  <div class="kpi-item">
    <strong>{project.units.length}</strong>
    <span>units</span>
  </div>
  <div class="kpi-item">
    <strong>{deliveryDate}</strong>
    <span>delivery</span>
  </div>
  <div class="kpi-item">
    <strong>7%</strong>
    <span>yield est.</span>
  </div>
</div>

<!-- Body Grid -->
<section class="body-section">
  <div class="container">
    <div class="body-grid">
      <!-- Main content -->
      <div class="body-main">
        <div class="units-section">
          <span class="label">AVAILABLE UNITS</span>
          {#if availableUnits.length === 0}
            <p class="empty">No available units at this time.</p>
          {:else}
            <div class="units-grid">
              {#each availableUnits as unit}
                <UnitCard
                  code={unit.code}
                  type={unit.type}
                  bedrooms={unit.bedrooms}
                  floor={unit.floor}
                  areaSqm={unit.areaSqm}
                  price={unit.price}
                  status={unit.status}
                  tourImages={unit.tourImages}
                />
              {/each}
            </div>
          {/if}
        </div>

        <ProjectTourSection units={project.units} onopen={openTour} />

        {#if project.constructionPhases.length > 0}
          <div class="timeline-section">
            <ConstructionTimeline phases={project.constructionPhases.map((p) => ({
              ...p,
              startDate: p.startDate ? p.startDate.toISOString() : null,
              endDate: p.endDate ? p.endDate.toISOString() : null,
            }))} />
          </div>
        {/if}
      </div>

      <!-- Sidebar: AI Concierge -->
      <aside class="body-sidebar">
        <AIChatWidget
          floating={false}
          role="public"
          projectName={project.name}
          projectSlug={project.slug}
        />
      </aside>
    </div>
  </div>
</section>

{#if tourUnit}
  <FloorTourViewer
    images={tourUnit.images}
    unitCode={tourUnit.code}
    onclose={() => (tourUnit = null)}
    floorPlanImage={tourUnit.floorPlanImage}
  />
{/if}

<style>
  .hero {
    height: 60vh;
    min-height: 400px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  .hero__bg {
    position: absolute;
    inset: -25% 0;
    background: linear-gradient(135deg, #2a2a28, #3a3a36);
    background-size: cover;
    background-position: center;
    will-change: transform;
  }

  .hero__overlay {
    position: relative;
    z-index: 1;
    background: rgba(30, 30, 28, 0.55);
    width: 100%;
    padding: var(--space-12) var(--space-10);
  }

  .hero__content {
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .hero__title {
    font-size: var(--text-5xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: #fff;
    margin: 0;
  }

  .hero__location {
    color: rgba(255, 255, 255, 0.7);
    font-size: var(--text-base);
    margin: 0;
  }

  .hero__price {
    color: var(--color-accent);
    font-size: var(--text-lg);
    font-weight: 700;
    margin: 0;
  }

  /* ── Marble KPI strip ──────────────────────── */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
    background: #ccc8c0;
    box-shadow: 0 1px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .kpi-item {
    padding: var(--space-6) var(--space-7);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    background: linear-gradient(160deg, #fdfaf6 0%, #f7f3ec 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      inset 0 -1px 0 rgba(0, 0, 0, 0.04);
    position: relative;
  }

  /* Subtle marble vein hint */
  .kpi-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      118deg,
      transparent 0%,
      transparent 38%,
      rgba(200, 190, 175, 0.12) 40%,
      transparent 42%,
      transparent 100%
    );
    pointer-events: none;
  }

  .kpi-item strong {
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
    position: relative;
  }

  .kpi-item span {
    font-size: var(--text-xs);
    color: rgba(80, 74, 64, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    position: relative;
  }

  .body-section {
    padding: var(--space-16) 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .body-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-10);
    align-items: start;
  }

  @media (max-width: 900px) {
    .body-grid { grid-template-columns: 1fr; }
  }

  .label {
    display: block;
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-5);
  }

  .units-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }

  @media (max-width: 700px) {
    .units-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .units-section { margin-bottom: var(--space-10); }
  .timeline-section { margin-top: var(--space-4); }

  .empty {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    padding: var(--space-8) 0;
  }

  .body-sidebar {
    position: sticky;
    top: var(--space-6);
  }

  @media (max-width: 480px) {
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .kpi-item { padding: var(--space-5) var(--space-5); }
  }
</style>
