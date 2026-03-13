<script lang="ts">
  interface TourImage { url: string; label: string }

  interface Unit {
    id: string;
    code: string;
    type: string;
    bedrooms: number;
    floor: number;
    areaSqm: number;
    tourImages?: string | null;
    tourFloorPlan?: string | null;
  }

  interface Props {
    units: Unit[];
    onopen: (unitCode: string) => void;
  }

  let { units, onopen }: Props = $props();

  // Start on the first unit that has a tour, or fall back to the first unit
  let activeCode = $state<string>(
    (units.find(u => u.tourImages) ?? units[0])?.code ?? ''
  );

  let activeUnit = $derived(units.find(u => u.code === activeCode) ?? units[0]);

  let tourImages = $derived.by<TourImage[]>(() => {
    if (!activeUnit?.tourImages) return [];
    try { return JSON.parse(activeUnit.tourImages); } catch { return []; }
  });

  let floorPlanUrl = $derived(activeUnit?.tourFloorPlan ?? null);

  function typeLabel(u: Unit): string {
    if (u.type === 'studio') return 'Studio';
    if (u.type === 'penthouse') return 'Penthouse';
    return `${u.bedrooms}-Bed`;
  }
</script>

{#if units.length > 0}
  <section class="ts">
    <div class="ts__header">
      <span class="ts__label">VIRTUAL TOURS</span>
      <h2 class="ts__title">Explore the Apartments</h2>
      <p class="ts__sub">AI-rendered room-by-room walkthroughs with 3D floor plans.</p>
    </div>

    <!-- Unit selector tabs -->
    <div class="ts__tabs" role="tablist">
      {#each units as unit}
        <button
          class="ts__tab"
          class:ts__tab--active={unit.code === activeCode}
          onclick={() => activeCode = unit.code}
          role="tab"
          aria-selected={unit.code === activeCode}
        >
          <span class="ts__tab-code">{unit.code}</span>
          <span class="ts__tab-type">{typeLabel(unit)}</span>
          {#if unit.tourImages}
            <span class="ts__tab-dot ts__tab-dot--tour" title="Tour available"></span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Feature area -->
    <div class="ts__feature">

      <!-- Left: Tour preview -->
      <div class="ts__panel ts__panel--tour">
        {#if tourImages.length > 0}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div class="ts__preview" onclick={() => onopen(activeUnit.code)}>
            <img
              src={tourImages[0].url}
              alt="{activeUnit.code} — {tourImages[0].label}"
              class="ts__preview-img"
              loading="lazy"
            />
            <div class="ts__preview-overlay">
              <div class="ts__play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span class="ts__preview-cta">Start Virtual Tour</span>
            </div>
            <div class="ts__preview-meta">
              <span class="ts__count">{tourImages.length} rooms</span>
              <span class="ts__unit-info">{activeUnit.areaSqm} m² · Floor {activeUnit.floor}</span>
            </div>
          </div>
        {:else}
          <div class="ts__empty">
            <div class="ts__empty-icon">
              <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                <rect x="4" y="8" width="40" height="28" rx="3" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="24" cy="22" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M21 22l4.5 2.6V19.4L21 22z" fill="currentColor"/>
              </svg>
            </div>
            <p class="ts__empty-title">Virtual tour coming soon</p>
            <p class="ts__empty-sub">A full room-by-room 3D walkthrough<br/>of this apartment will be available shortly.</p>
          </div>
        {/if}
        <div class="ts__panel-label">3D Tour</div>
      </div>

      <!-- Right: Floor plan -->
      <div class="ts__panel ts__panel--plan">
        {#if floorPlanUrl}
          <div class="ts__plan-wrap">
            <img
              src={floorPlanUrl}
              alt="3D floor plan — {activeUnit.code}"
              class="ts__plan-img"
              loading="lazy"
            />
          </div>
        {:else}
          <div class="ts__empty">
            <div class="ts__empty-icon">
              <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                <rect x="6" y="6" width="36" height="36" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <rect x="6" y="6" width="18" height="18" rx="1" stroke="currentColor" stroke-width="1"/>
                <rect x="6" y="24" width="18" height="18" rx="1" stroke="currentColor" stroke-width="1"/>
                <rect x="24" y="6" width="18" height="36" rx="1" stroke="currentColor" stroke-width="1"/>
              </svg>
            </div>
            <p class="ts__empty-title">3D floor plan coming soon</p>
            <p class="ts__empty-sub">An isometric 3D floor plan<br/>for this apartment will appear here.</p>
          </div>
        {/if}
        <div class="ts__panel-label">Floor Plan</div>
      </div>

    </div>
  </section>
{/if}

<style>
  .ts {
    margin-bottom: var(--space-10);
  }

  .ts__header {
    margin-bottom: var(--space-5);
  }

  .ts__label {
    display: block;
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-accent);
    margin-bottom: var(--space-2);
  }

  .ts__title {
    font-size: var(--text-2xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0 0 var(--space-2);
  }

  .ts__sub {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  /* ── Tabs ──────────────────────────────────────── */
  .ts__tabs {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    margin-bottom: var(--space-4);
  }

  .ts__tab {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: rgba(122, 140, 110, 0.06);
    border: 1px solid rgba(122, 140, 110, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: background var(--transition-base), border-color var(--transition-base);
  }

  .ts__tab:hover {
    background: rgba(122, 140, 110, 0.11);
    border-color: rgba(122, 140, 110, 0.3);
  }

  .ts__tab--active {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  .ts__tab-code {
    font-family: monospace;
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-accent);
    letter-spacing: 0.05em;
  }

  .ts__tab--active .ts__tab-code {
    color: #fff;
  }

  .ts__tab-type {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .ts__tab--active .ts__tab-type {
    color: rgba(255,255,255,0.8);
  }

  .ts__tab-dot--tour {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
  }

  .ts__tab--active .ts__tab-dot--tour {
    background: rgba(255,255,255,0.7);
  }

  /* ── Feature layout ────────────────────────────── */
  .ts__feature {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: var(--space-4);
    min-height: 320px;
  }

  .ts__panel {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid rgba(122, 140, 110, 0.14);
    background: #f5f2ee;
  }

  .ts__panel-label {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    background: rgba(20,20,18,0.45);
    backdrop-filter: blur(4px);
    padding: 3px 8px;
    border-radius: 20px;
    z-index: 2;
    pointer-events: none;
  }

  /* Tour preview panel */
  .ts__preview {
    width: 100%;
    height: 100%;
    min-height: 320px;
    position: relative;
    cursor: pointer;
    display: block;
  }

  .ts__preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  .ts__preview:hover .ts__preview-img {
    transform: scale(1.03);
  }

  .ts__preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    background: rgba(20, 20, 18, 0.28);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  .ts__preview:hover .ts__preview-overlay {
    opacity: 1;
  }

  .ts__play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    transition: transform var(--transition-base);
  }

  .ts__preview:hover .ts__play-btn {
    transform: scale(1.08);
  }

  .ts__preview-cta {
    font-size: var(--text-sm);
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  .ts__preview-meta {
    position: absolute;
    bottom: var(--space-3);
    right: var(--space-3);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    z-index: 2;
  }

  .ts__count,
  .ts__unit-info {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #fff;
    background: rgba(20,20,18,0.55);
    backdrop-filter: blur(4px);
    padding: 2px 8px;
    border-radius: 20px;
  }

  /* Floor plan panel */
  .ts__plan-wrap {
    width: 100%;
    height: 100%;
    min-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
    box-sizing: border-box;
  }

  .ts__plan-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-md);
  }

  /* Empty states */
  .ts__empty {
    width: 100%;
    height: 100%;
    min-height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-6);
    text-align: center;
    box-sizing: border-box;
  }

  .ts__empty-icon {
    color: rgba(122, 140, 110, 0.4);
  }

  .ts__empty-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    margin: 0;
  }

  .ts__empty-sub {
    font-size: var(--text-xs);
    color: rgba(122, 140, 110, 0.6);
    line-height: 1.5;
    margin: 0;
  }

  @media (max-width: 700px) {
    .ts__feature { grid-template-columns: 1fr; }
    .ts__preview, .ts__plan-wrap, .ts__empty { min-height: 220px; }
  }
</style>
