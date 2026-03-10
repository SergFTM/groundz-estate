<script lang="ts">
  import { enhance } from '$app/forms';
  import UnitCard from '$lib/components/UnitCard.svelte';
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ConstructionTimeline from '$lib/components/cabinet/ConstructionTimeline.svelte';

  let { data, form } = $props();
  let { project } = $derived(data);

  let formErrors = $derived((form as { errors?: Record<string, string>; success?: boolean } | null)?.errors ?? {});

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

<!-- Hero -->
<section class="hero" style={project.imageUrl ? `background-image: url(${project.imageUrl})` : ''}>
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
                />
              {/each}
            </div>
          {/if}
        </div>

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

      <!-- Sidebar -->
      <aside class="body-sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-title">Book a Consultation</h3>

          {#if form?.success}
            <p class="success-msg">Request sent! We'll be in touch shortly.</p>
          {:else}
            <form method="POST" action="?/bookConsultation" use:enhance>
              <input type="hidden" name="project" value={project.slug} />

              <div class="form-field">
                <label for="name">Your Name</label>
                <input id="name" name="name" type="text" placeholder="Full name" required />
                {#if formErrors.name}<span class="field-error">{formErrors.name}</span>{/if}
              </div>

              <div class="form-field">
                <label for="phone">Phone Number</label>
                <input id="phone" name="phone" type="tel" placeholder="+357 99 000000" required />
                {#if formErrors.phone}<span class="field-error">{formErrors.phone}</span>{/if}
              </div>

              <div class="form-field">
                <label for="timeSlot">Preferred Time</label>
                <select id="timeSlot" name="timeSlot" required>
                  <option value="">Select time...</option>
                  <option value="morning">Morning (9–12)</option>
                  <option value="afternoon">Afternoon (12–17)</option>
                  <option value="evening">Evening (17–20)</option>
                </select>
                {#if formErrors.timeSlot}<span class="field-error">{formErrors.timeSlot}</span>{/if}
              </div>

              <button type="submit" class="btn-primary">Send Request →</button>
            </form>
          {/if}
        </div>
      </aside>
    </div>
  </div>
</section>

<style>
  .hero {
    height: 60vh;
    min-height: 400px;
    background: linear-gradient(135deg, #2a2a28, #3a3a36);
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    align-items: flex-end;
  }

  .hero__overlay {
    background: rgba(30, 30, 28, 0.65);
    backdrop-filter: blur(2px);
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

  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .kpi-item {
    padding: var(--space-5) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  .kpi-item:last-child { border-right: none; }

  .kpi-item strong {
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
  }

  .kpi-item span {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
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

  .sidebar-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .sidebar-title {
    font-size: var(--text-base);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text);
    margin: 0 0 var(--space-5);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
  }

  .form-field label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .form-field input,
  .form-field select {
    padding: var(--space-3) var(--space-4);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.8);
    font-size: var(--text-sm);
    color: var(--color-text);
    width: 100%;
    box-sizing: border-box;
  }

  .btn-primary {
    width: 100%;
    padding: var(--space-4);
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-base);
  }

  .btn-primary:hover { opacity: 0.88; }

  .field-error {
    font-size: var(--text-xs);
    color: #ef4444;
  }

  .success-msg {
    text-align: center;
    color: var(--color-accent);
    font-weight: 600;
    padding: var(--space-6) 0;
  }

  @media (max-width: 480px) {
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .kpi-item { border-bottom: 1px solid rgba(0,0,0,0.06); }
  }
</style>
