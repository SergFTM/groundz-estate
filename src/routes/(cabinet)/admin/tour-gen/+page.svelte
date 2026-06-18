<script lang="ts">
  import { getRooms } from '$lib/tour-rooms';
  import FloorPlanDiagram from '$lib/components/FloorPlanDiagram.svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import {
    type TourImage, type UnitRow, type GenStatus,
    ANGLE_ICON, ANGLE_LABEL, parseImages, estimateCost, typeLabel, isPdf,
  } from './tour-gen.helpers';

  let { data } = $props();

  let selected = $state<UnitRow | null>(null);
  let statuses = $state<Record<string, GenStatus>>({});
  let previewImages = $state<Record<string, TourImage[]>>({});
  let genErrors = $state<Record<string, string>>({});

  function select(unit: UnitRow) {
    selected = unit;
  }

  // Load saved tour images whenever selection changes
  $effect(() => {
    if (selected && selected.tourImages && !previewImages[selected.id]) {
      previewImages[selected.id] = parseImages(selected);
    }
  });

  async function generate(unit: UnitRow, fillOnly = false) {
    statuses[unit.id] = 'generating';
    genErrors[unit.id] = '';
    if (!fillOnly) viewIndex = 0;

    try {
      const res = await fetch('/api/generate-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: unit.id, fillOnly, imageQuality: liveImageQuality }),
      });
      const json = await res.json();

      if (!res.ok) {
        statuses[unit.id] = 'error';
        genErrors[unit.id] = json.message ?? 'Generation failed';
        return;
      }

      previewImages[unit.id] = json.images;
      statuses[unit.id] = 'done';
      viewIndex = 0;

      const idx = data.units.findIndex((u: UnitRow) => u.id === unit.id);
      if (idx !== -1) data.units[idx].hasTour = true;
    } catch (e) {
      statuses[unit.id] = 'error';
      genErrors[unit.id] = String(e);
    }
  }

  let rooms = $derived(selected ? getRooms(selected.type) : []);
  let currentImages = $derived(selected ? (previewImages[selected.id] ?? parseImages(selected)) : []);
  let currentStatus = $derived(selected ? (statuses[selected.id] ?? 'idle') : 'idle');

  // How many room+angle combos are still missing
  let missingCount = $derived.by(() => {
    if (!selected || rooms.length === 0) return 0;
    const total = rooms.length * 3;
    const withAngle = currentImages.filter(img => img.roomIndex != null && img.angle);
    // Old-format images (pre-angle update) have no angle metadata — fall back to raw count
    if (withAngle.length === 0 && currentImages.length > 0) {
      return Math.max(0, total - currentImages.length);
    }
    const existingKeys = new Set(withAngle.map(img => `${img.roomIndex}-${img.angle}`));
    return Math.max(0, total - existingKeys.size);
  });

  // Live model config — refreshed from DB when a unit is selected
  let liveImageModel   = $state<string>(data.imageModel);
  let liveImageQuality = $state<'low' | 'medium' | 'high'>('high');

  $effect(() => {
    if (selected) {
      fetch('/api/model-config')
        .then(r => r.json())
        .then(d => {
          liveImageModel   = d.imageModel   ?? data.imageModel;
          liveImageQuality = d.imageQuality ?? 'high';
        })
        .catch(() => {});
    }
  });

  const cost = (count: number) => estimateCost(count, liveImageModel, liveImageQuality);

  // ── Tour viewer ──────────────────────────────────────────
  let viewIndex = $state(0);
  let flyX = $state(80); // positive = forward (in from right), negative = backward (in from left)

  // Reset viewer when unit changes
  $effect(() => {
    if (selected) viewIndex = 0;
  });

  // Clamp viewIndex if images shrink (e.g. after delete)
  $effect(() => {
    if (viewIndex >= currentImages.length && currentImages.length > 0) {
      viewIndex = currentImages.length - 1;
    }
  });

  function goTo(idx: number) {
    if (idx < 0 || idx >= currentImages.length || idx === viewIndex) return;
    flyX = idx > viewIndex ? 80 : -80;
    viewIndex = idx;
  }

  function nextSlide() { goTo(viewIndex + 1); }
  function prevSlide() { goTo(viewIndex - 1); }

  // Keyboard ← →
  function onKeydown(e: KeyboardEvent) {
    if (!selected || currentImages.length === 0) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prevSlide(); }
  }

  // ── Per-image controls ──────────────────────────────────
  let regenIndex = $state<Record<string, number | null>>({});
  let dirty = $state<Record<string, boolean>>({});
  let saving = $state<Record<string, boolean>>({});

  function deleteImage(unitId: string, idx: number) {
    const imgs = [...(previewImages[unitId] ?? [])];
    imgs.splice(idx, 1);
    previewImages[unitId] = imgs;
    dirty[unitId] = true;
    if (viewIndex >= imgs.length && imgs.length > 0) viewIndex = imgs.length - 1;
  }

  async function regenImage(unit: UnitRow, flatIdx: number) {
    const img = previewImages[unit.id]?.[flatIdx];
    if (!img) return;
    regenIndex[unit.id] = flatIdx;
    try {
      const res = await fetch('/api/regenerate-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: unit.id,
          roomIndex: img.roomIndex ?? flatIdx,
          angle: img.angle ?? 'front',
        }),
      });
      const j = await res.json();
      if (!res.ok) { genErrors[unit.id] = j.message ?? 'Regen failed'; return; }
      const imgs = [...(previewImages[unit.id] ?? [])];
      imgs[flatIdx] = { url: j.url, label: j.label, roomIndex: j.roomIndex, angle: j.angle };
      previewImages[unit.id] = imgs;
      dirty[unit.id] = true;
      viewIndex = flatIdx; // jump to regenerated image
    } catch (e) {
      genErrors[unit.id] = String(e);
    } finally {
      regenIndex[unit.id] = null;
    }
  }

  async function saveImages(unit: UnitRow) {
    saving[unit.id] = true;
    try {
      await fetch('/api/save-tour-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: unit.id, images: previewImages[unit.id] ?? [] }),
      });
      dirty[unit.id] = false;
      const idx = data.units.findIndex((u: UnitRow) => u.id === unit.id);
      if (idx !== -1) data.units[idx].hasTour = (previewImages[unit.id]?.length ?? 0) > 0;
    } finally {
      saving[unit.id] = false;
    }
  }

  // ── API key test ─────────────────────────────────────────
  let testStatus = $state<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  let testError = $state('');
  let testModel = $state('');
  async function testApiKey() {
    testStatus = 'testing';
    testError = '';
    try {
      const res = await fetch('/api/test-gemini');
      const d = await res.json();
      testModel = d.model ?? '';
      if (d.ok) { testStatus = 'ok'; }
      else { testStatus = 'fail'; testError = d.error ?? 'Unknown error'; }
    } catch (e) { testStatus = 'fail'; testError = String(e); }
  }

  // ── Plan view ─────────────────────────────────────────────
  let planView = $state<'schematic' | 'uploaded' | 'ai3d'>('schematic');
  $effect(() => {
    if (selected) {
      if (selected.tourFloorPlan) planView = 'ai3d';
      else if (selected.floorPlanUrl) planView = 'uploaded';
      else planView = 'schematic';
    }
  });

  // ── 3D Floor plan generation ─────────────────────────────
  let fpStatuses = $state<Record<string, 'idle' | 'generating' | 'done' | 'error'>>({});
  let fpUrls     = $state<Record<string, string>>({});
  let fpErrors   = $state<Record<string, string>>({});

  $effect(() => {
    if (selected?.tourFloorPlan && !fpUrls[selected.id]) {
      fpUrls[selected.id] = selected.tourFloorPlan;
    }
  });

  async function generateFloorPlan(unit: UnitRow) {
    fpStatuses[unit.id] = 'generating';
    fpErrors[unit.id]   = '';
    try {
      const res  = await fetch('/api/generate-floor-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: unit.id, imageQuality: liveImageQuality }),
      });
      const json = await res.json();
      if (!res.ok) {
        fpStatuses[unit.id] = 'error';
        fpErrors[unit.id]   = json.message ?? 'Generation failed';
        return;
      }
      fpUrls[unit.id]     = json.url;
      fpStatuses[unit.id] = 'done';
      planView = 'ai3d';
    } catch (e) {
      fpStatuses[unit.id] = 'error';
      fpErrors[unit.id]   = String(e);
    }
  }

</script>

<svelte:window on:keydown={onKeydown} />

<div class="tg">
  <div class="tg__header">
    <p class="tg__breadcrumb">Admin · AI</p>
    <h1 class="tg__title">Tour Generator</h1>
  </div>

  {#if !data.openaiKeySet}
    <div class="tg__warning">
      OpenAI API key not set.
      <a href="/admin/settings">Settings → OpenAI</a>
    </div>
  {:else}
    <div class="tg__test-bar">
      <button class="tg__test-btn" onclick={testApiKey} disabled={testStatus === 'testing'}>
        {testStatus === 'testing' ? 'Testing…' : 'Test API Key'}
      </button>
      {#if testStatus === 'ok'}
        <span class="tg__test-ok">✓ {testModel} accessible</span>
      {:else if testStatus === 'fail'}
        <span class="tg__test-fail">✗ {testError}</span>
      {/if}
    </div>
  {/if}

  <div class="tg__layout">
    <!-- Left: unit table -->
    <div class="tg__list">
      <div class="tg__list-head">
        <span>Unit</span><span>Project</span><span>Status</span>
      </div>
      {#each data.units as unit}
        {@const st = statuses[unit.id] ?? 'idle'}
        <button
          class="tg__row"
          class:tg__row--selected={selected?.id === unit.id}
          class:tg__row--done={st === 'done'}
          onclick={() => select(unit)}
        >
          <span class="tg__row-code">{unit.code}</span>
          <span class="tg__row-proj">{unit.projectName}</span>
          <span class="tg__row-badge">
            {#if st === 'generating'}
              <span class="badge badge--gen">…</span>
            {:else if st === 'done'}
              <span class="badge badge--done">✓</span>
            {:else if st === 'error'}
              <span class="badge badge--err">!</span>
            {:else if unit.hasTour}
              <span class="badge badge--has">✓</span>
            {:else}
              <span class="badge badge--none">–</span>
            {/if}
          </span>
        </button>
      {/each}
    </div>

    <!-- Right: widgets -->
    <div class="tg__panels">
      {#if selected}
        <!-- Widget 1: Floor Plan -->
        <div class="tg__widget">
          <div class="tg__widget-head">
            <div class="tg__widget-title">
              <span class="tg__widget-label">FLOOR PLAN</span>
              <span class="tg__widget-unit">{selected.code}</span>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;">
              <!-- Plan view tabs -->
              <div class="tg__plan-tabs">
                <button
                  class="tg__plan-tab"
                  class:tg__plan-tab--active={planView === 'schematic'}
                  onclick={() => planView = 'schematic'}
                >Schematic</button>
                <button
                  class="tg__plan-tab"
                  class:tg__plan-tab--active={planView === 'uploaded'}
                  disabled={!selected.floorPlanUrl}
                  onclick={() => planView = 'uploaded'}
                >Uploaded{selected.floorPlanUrl ? '' : ' —'}</button>
                <button
                  class="tg__plan-tab"
                  class:tg__plan-tab--active={planView === 'ai3d'}
                  onclick={() => planView = 'ai3d'}
                >3D AI{fpUrls[selected.id] || selected.tourFloorPlan ? '' : ' —'}</button>
              </div>
              <div class="tg__widget-meta">
                <span>{typeLabel(selected.type, selected.bedrooms)}</span>
                <span>{selected.areaSqm} m²</span>
                <span>Floor {selected.floor}</span>
              </div>
            </div>
          </div>

          <!-- Plan view area -->
          {#if planView === 'schematic'}
            <div class="tg__plan-view">
              <FloorPlanDiagram unitType={selected.type} areaSqm={selected.areaSqm} />
            </div>
          {:else if selected.floorPlanUrl}
            <div class="tg__plan-view tg__plan-view--uploaded">
              {#if isPdf(selected.floorPlanUrl)}
                <iframe
                  src={selected.floorPlanUrl}
                  title="Floor plan — {selected.code}"
                  class="tg__plan-pdf"
                ></iframe>
              {:else}
                <img
                  src={selected.floorPlanUrl}
                  alt="Floor plan — {selected.code}"
                  class="tg__plan-img"
                />
              {/if}
              <a href={selected.floorPlanUrl} target="_blank" class="tg__plan-open">Open full size ↗</a>
            </div>
          {/if}

          <!-- AI 3D Floor Plan view -->
          {#if planView === 'ai3d'}
            {@const fpUrl = fpUrls[selected.id] ?? selected.tourFloorPlan}
            <div class="tg__plan-view tg__plan-view--ai3d">
              {#if fpStatuses[selected.id] === 'generating'}
                <div class="tg__fp-generating">
                  <span class="tg__spinner"></span>
                  <span>Generating 3D floor plan…</span>
                </div>
              {:else if fpUrl}
                <img src={fpUrl} alt="3D floor plan — {selected.code}" class="tg__plan-img" />
                <a href={fpUrl} target="_blank" class="tg__plan-open">Open full size ↗</a>
              {:else}
                <div class="tg__fp-empty">
                  <p>No 3D floor plan yet.</p>
                </div>
              {/if}
              {#if fpErrors[selected.id]}
                <p class="tg__gen-error" style="margin:var(--space-2) var(--space-4)">{fpErrors[selected.id]}</p>
              {/if}
            </div>
            <!-- Floor plan gen button -->
            <div class="tg__gen-bar" style="border-top: none; padding-top: 0;">
              <button
                class="tg__btn-generate"
                disabled={!data.openaiKeySet || fpStatuses[selected.id] === 'generating'}
                onclick={() => selected && generateFloorPlan(selected)}
              >
                {fpStatuses[selected.id] === 'generating' ? '…' : (fpUrl ? '↺ Regenerate 3D Plan' : '▶ Generate 3D Plan')}
              </button>
              {#if liveImageModel === 'gpt-image-1'}
                <div class="tg__quality-toggle">
                  {#each (['low', 'medium', 'high'] as const) as q}
                    <button
                      class="tg__quality-btn"
                      class:tg__quality-btn--active={liveImageQuality === q}
                      onclick={() => liveImageQuality = q}
                    >{q}</button>
                  {/each}
                </div>
              {/if}
              <span class="tg__cost-hint">{cost(1)} · {liveImageModel}</span>
            </div>
          {/if}

          <!-- Room schedule -->
          <div class="tg__rooms-head">Room Schedule</div>
          <div class="tg__rooms">
            {#each rooms as room, i}
              <div class="tg__room">
                <span class="tg__room-num">{i + 1}</span>
                <span class="tg__room-name">{room.label}</span>
                {#if room.dims}
                  <span class="tg__room-dims">{room.dims}</span>
                {/if}
                {#if room.areaSqm}
                  <span class="tg__room-area">{room.areaSqm} m²</span>
                {/if}
              </div>
            {/each}
          </div>

          <div class="tg__gen-bar">
            {#if currentStatus === 'generating'}
              <button class="tg__btn-generate" disabled>
                <span class="tg__spinner"></span> Generating…
              </button>
            {:else if missingCount > 0 && currentImages.length > 0}
              <!-- Partial tour: offer fill or full regen -->
              <button
                class="tg__btn-generate tg__btn-generate--fill"
                disabled={!data.openaiKeySet}
                onclick={() => selected && generate(selected, true)}
              >
                ＋ Fill {missingCount} missing
              </button>
              <button
                class="tg__btn-generate tg__btn-generate--ghost"
                disabled={!data.openaiKeySet}
                onclick={() => selected && generate(selected, false)}
              >
                ↺ Regenerate All
              </button>
              {#if liveImageModel === 'gpt-image-1'}
                <div class="tg__quality-toggle">
                  {#each (['low', 'medium', 'high'] as const) as q}
                    <button
                      class="tg__quality-btn"
                      class:tg__quality-btn--active={liveImageQuality === q}
                      onclick={() => liveImageQuality = q}
                    >{q}</button>
                  {/each}
                </div>
              {/if}
              <span class="tg__cost-hint">{cost(missingCount)} · {liveImageModel}</span>
            {:else if currentImages.length > 0}
              <!-- Complete tour -->
              <button
                class="tg__btn-generate"
                disabled={!data.openaiKeySet}
                onclick={() => selected && generate(selected, false)}
              >
                ↺ Regenerate Tour
              </button>
              {#if liveImageModel === 'gpt-image-1'}
                <div class="tg__quality-toggle">
                  {#each (['low', 'medium', 'high'] as const) as q}
                    <button
                      class="tg__quality-btn"
                      class:tg__quality-btn--active={liveImageQuality === q}
                      onclick={() => liveImageQuality = q}
                    >{q}</button>
                  {/each}
                </div>
              {/if}
              <span class="tg__cost-hint">{cost(rooms.length * 3)} · {liveImageModel}</span>
            {:else}
              <!-- No tour yet -->
              <button
                class="tg__btn-generate"
                disabled={!data.openaiKeySet}
                onclick={() => selected && generate(selected, false)}
              >
                ▶ Generate Tour — {rooms.length * 3} images
              </button>
              {#if liveImageModel === 'gpt-image-1'}
                <div class="tg__quality-toggle">
                  {#each (['low', 'medium', 'high'] as const) as q}
                    <button
                      class="tg__quality-btn"
                      class:tg__quality-btn--active={liveImageQuality === q}
                      onclick={() => liveImageQuality = q}
                    >{q}</button>
                  {/each}
                </div>
              {/if}
              <span class="tg__cost-hint">{cost(rooms.length * 3)} · {liveImageModel}</span>
            {/if}
            {#if genErrors[selected.id]}
              <p class="tg__gen-error">{genErrors[selected.id]}</p>
            {/if}
          </div>
        </div>

        <!-- Widget 2: Tour Preview -->
        <div class="tg__widget tg__widget--preview">
          <div class="tg__widget-head">
            <div class="tg__widget-title">
              <span class="tg__widget-label">TOUR PREVIEW</span>
              {#if currentImages.length > 0}
                <span class="tg__widget-unit">{currentImages.length} shots</span>
              {/if}
            </div>
            {#if dirty[selected.id]}
              <button
                class="tg__btn-save"
                onclick={() => selected && saveImages(selected)}
                disabled={saving[selected.id]}
              >
                {#if saving[selected.id]}
                  <span class="tg__spinner tg__spinner--dark"></span> Saving…
                {:else}
                  ✓ Save changes
                {/if}
              </button>
            {/if}
          </div>

          {#if currentStatus === 'generating'}
            <div class="tg__preview-placeholder">
              <div class="tg__preview-pulse"></div>
              <p>Generating {rooms.length * 3} images via OpenAI…</p>
              <p class="tg__preview-hint">3 angles × {rooms.length} rooms · ~{Math.round(rooms.length * 3 * 15)}s</p>
            </div>
          {:else if currentImages.length > 0}
            <!-- Main viewer -->
            <div class="tg__viewer">
              <button
                class="tg__nav-btn tg__nav-btn--prev"
                onclick={prevSlide}
                disabled={viewIndex === 0}
                aria-label="Previous"
              >‹</button>

              <div class="tg__viewer-frame">
                {#key `${selected.id}-${viewIndex}`}
                  <img
                    src={currentImages[viewIndex].url}
                    alt={currentImages[viewIndex].label}
                    class="tg__viewer-img"
                    in:fly={{ x: flyX, duration: 380, easing: cubicOut }}
                    out:fly={{ x: -flyX, duration: 380, easing: cubicOut }}
                  />
                {/key}
              </div>

              <button
                class="tg__nav-btn tg__nav-btn--next"
                onclick={nextSlide}
                disabled={viewIndex === currentImages.length - 1}
                aria-label="Next"
              >›</button>
            </div>

            <!-- Info bar -->
            <div class="tg__viewer-info">
              <span class="tg__viewer-room">{currentImages[viewIndex].label}</span>
              {#if currentImages[viewIndex].angle}
                <div class="tg__angle-bar">
                  {#each ['left', 'front', 'right'] as a}
                    <span
                      class="tg__angle-dot"
                      class:tg__angle-dot--active={currentImages[viewIndex].angle === a}
                      title={ANGLE_LABEL[a]}
                    >{ANGLE_ICON[a]}</span>
                  {/each}
                </div>
              {/if}
              <span class="tg__viewer-counter">{viewIndex + 1} / {currentImages.length}</span>
            </div>

            <!-- Filmstrip -->
            <div class="tg__filmstrip">
              {#each currentImages as img, i}
                {@const isRoomStart = i === 0 || img.roomIndex !== currentImages[i - 1].roomIndex}
                {#if isRoomStart && img.roomIndex != null}
                  <div class="tg__film-room-label">{img.label}</div>
                {/if}
                <div
                  class="tg__film-item"
                  class:tg__film-item--active={i === viewIndex}
                >
                  <div class="tg__film-img-wrap">
                    <button class="tg__film-thumb" onclick={() => goTo(i)}>
                      <img src={img.url} alt={img.label} loading="lazy" />
                      {#if img.angle}
                        <span class="tg__film-angle">{ANGLE_ICON[img.angle]}</span>
                      {/if}
                    </button>
                    <div class="tg__preview-overlay">
                      <button
                        class="tg__preview-btn tg__preview-btn--regen"
                        onclick={() => selected && regenImage(selected, i)}
                        disabled={regenIndex[selected.id] != null}
                        title="Regenerate"
                      >
                        {#if regenIndex[selected.id] === i}
                          <span class="tg__spinner tg__spinner--sm"></span>
                        {:else}
                          ↺
                        {/if}
                      </button>
                      <button
                        class="tg__preview-btn tg__preview-btn--del"
                        onclick={() => selected && deleteImage(selected.id, i)}
                        disabled={regenIndex[selected.id] != null}
                        title="Delete"
                      >×</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="tg__preview-empty">
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect x="4" y="10" width="40" height="28" rx="3" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="16" cy="22" r="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M4 32l10-8 8 6 8-10 14 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
              <p>Click Generate to create the AI tour</p>
            </div>
          {/if}
        </div>

      {:else}
        <!-- No selection state -->
        <div class="tg__empty-state">
          <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
            <rect x="8" y="8" width="48" height="48" rx="4" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="20" x2="56" y2="20" stroke="currentColor" stroke-width="1"/>
            <line x1="8" y1="32" x2="56" y2="32" stroke="currentColor" stroke-width="0.6"/>
            <line x1="8" y1="44" x2="56" y2="44" stroke="currentColor" stroke-width="0.6"/>
            <rect x="20" y="26" width="24" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          <p>Select a unit from the list<br/>to preview its floor plan and tour</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .tg {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1400px;
  }

  .tg__header {
    flex-shrink: 0;
  }

  .tg__breadcrumb {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-body);
    margin-bottom: var(--space-2);
  }

  .tg__title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    color: var(--color-text);
    margin: 0;
  }

  .tg__warning {
    padding: var(--space-4) var(--space-5);
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-lg);
    font-size: var(--text-sm);
    color: #92400e;
    flex-shrink: 0;
  }

  .tg__warning a { color: var(--color-accent); font-weight: 600; }

  .tg__test-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .tg__test-btn {
    padding: var(--space-2) var(--space-4);
    background: none;
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-base);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-body);
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }
  .tg__test-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .tg__test-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .tg__test-ok { font-size: var(--text-xs); font-weight: 600; color: #166534; }
  .tg__test-fail { font-size: var(--text-xs); font-weight: 600; color: #991b1b; max-width: 500px; }

  /* Main 2-column layout */
  .tg__layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--space-5);
    flex: 1;
    min-height: 0;
  }

  /* Unit list */
  .tg__list {
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-lg);
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--color-bg);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .tg__list-head {
    display: grid;
    grid-template-columns: 72px 1fr 44px;
    padding: var(--space-2) var(--space-4);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border, #e8e4de);
    background: var(--color-bg-alt);
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0;
  }

  .tg__row {
    display: grid;
    grid-template-columns: 72px 1fr 44px;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
    width: 100%;
  }

  .tg__row:last-child { border-bottom: none; }
  .tg__row:hover { background: rgba(122, 140, 110, 0.05); }

  .tg__row--selected {
    background: rgba(122, 140, 110, 0.1) !important;
    border-left: 2px solid var(--color-accent);
  }

  .tg__row--done { background: rgba(34, 197, 94, 0.03); }

  .tg__row-code {
    font-family: monospace;
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-text);
  }

  .tg__row-proj {
    font-size: var(--text-xs);
    color: var(--color-text-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: var(--space-2);
  }

  .tg__row-type {
    font-size: var(--text-xs);
    color: var(--color-text-body);
  }

  .tg__row-badge { display: flex; justify-content: flex-end; }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 800;
  }

  .badge--has  { background: rgba(122,140,110,0.15); color: var(--color-accent); }
  .badge--none { background: var(--color-bg-alt); color: var(--color-text-body); }
  .badge--gen  { background: rgba(245,158,11,0.15); color: #92400e; }
  .badge--done { background: rgba(34,197,94,0.15); color: #166534; }
  .badge--err  { background: rgba(239,68,68,0.15); color: #991b1b; }

  /* Right panels */
  .tg__panels {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    overflow-y: auto;
    min-height: 0;
  }

  .tg__widget {
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-bg);
  }

  .tg__widget-head {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border, #e8e4de);
    background: var(--color-bg-alt);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tg__widget-title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .tg__widget-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-body);
  }

  .tg__widget-unit {
    font-family: monospace;
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    background: rgba(122, 140, 110, 0.1);
    padding: 2px 7px;
    border-radius: 20px;
  }

  .tg__widget-meta {
    display: flex;
    gap: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-body);
  }

  /* Plan view tabs */
  .tg__plan-tabs {
    display: flex;
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-base);
    overflow: hidden;
  }

  .tg__plan-tab {
    padding: 3px 12px;
    border: none;
    background: none;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .tg__plan-tab:not(:last-child) {
    border-right: 1px solid var(--color-border, #e8e4de);
  }

  .tg__plan-tab--active {
    background: var(--color-accent);
    color: #fff;
  }

  .tg__plan-tab:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* Plan view area */
  .tg__plan-view {
    border-bottom: 1px solid var(--color-border, #e8e4de);
    background: #faf9f7;
  }

  .tg__plan-view--uploaded,
  .tg__plan-view--ai3d {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-3);
    gap: var(--space-2);
  }

  .tg__fp-generating,
  .tg__fp-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 160px;
    color: rgba(0, 0, 0, 0.4);
    font-size: var(--text-sm);
  }

  .tg__plan-img {
    max-width: 100%;
    max-height: 380px;
    object-fit: contain;
    border-radius: var(--radius-sm);
    display: block;
  }

  .tg__plan-pdf {
    width: 100%;
    height: 380px;
    border: none;
    border-radius: var(--radius-sm);
    display: block;
  }

  .tg__plan-open {
    font-size: var(--text-xs);
    color: var(--color-accent);
    font-weight: 600;
    text-decoration: none;
  }

  .tg__plan-open:hover { text-decoration: underline; }

  /* Room schedule header */
  .tg__rooms-head {
    padding: var(--space-2) var(--space-5);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    border-bottom: 1px solid rgba(0,0,0,0.04);
    background: var(--color-bg-alt);
  }

  /* Room list */
  .tg__rooms {
    padding: var(--space-3) 0;
    max-height: 260px;
    overflow-y: auto;
  }

  .tg__room {
    display: grid;
    grid-template-columns: 24px 1fr auto auto;
    align-items: center;
    padding: var(--space-2) var(--space-5);
    gap: var(--space-3);
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  }

  .tg__room:last-child { border-bottom: none; }

  .tg__room-num {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-body);
    text-align: right;
  }

  .tg__room-name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .tg__room-dims {
    font-size: var(--text-xs);
    color: var(--color-text-body);
    font-family: monospace;
  }

  .tg__room-area {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    min-width: 48px;
    text-align: right;
  }

  /* Generate bar */
  .tg__gen-bar {
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--color-border, #e8e4de);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }

  .tg__btn-generate {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-base);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .tg__btn-generate:hover { opacity: 0.88; }
  .tg__btn-generate:disabled { opacity: 0.45; cursor: not-allowed; }

  .tg__btn-generate--fill {
    background: var(--color-accent);
  }

  .tg__btn-generate--ghost {
    background: none;
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
  }
  .tg__btn-generate--ghost:hover:not(:disabled) {
    background: rgba(122, 140, 110, 0.08);
    opacity: 1;
  }

  /* Quality toggle */
  .tg__quality-toggle {
    display: flex;
    border: 1px solid var(--color-border, #e8e4de);
    border-radius: var(--radius-base);
    overflow: hidden;
    flex-shrink: 0;
  }

  .tg__quality-btn {
    padding: 6px 10px;
    border: none;
    background: none;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: capitalize;
    transition: background var(--transition-fast), color var(--transition-fast);
    letter-spacing: 0.04em;
  }

  .tg__quality-btn:not(:last-child) {
    border-right: 1px solid var(--color-border, #e8e4de);
  }

  .tg__quality-btn--active {
    background: var(--color-accent);
    color: #fff;
  }

  .tg__cost-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-family: monospace;
    opacity: 0.75;
    white-space: nowrap;
  }

  .tg__gen-error {
    margin-top: var(--space-2);
    font-size: var(--text-xs);
    color: #991b1b;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .tg__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── Save button ─────────────────────────── */
  .tg__btn-save {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-base);
    font-size: var(--text-xs);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .tg__btn-save:hover { opacity: 0.88; }
  .tg__btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

  .tg__spinner--dark {
    border-color: rgba(255,255,255,0.35);
    border-top-color: #fff;
    width: 11px; height: 11px;
  }
  .tg__spinner--sm {
    width: 12px; height: 12px;
    border-width: 2px;
    border-color: rgba(122,140,110,0.3);
    border-top-color: var(--color-accent);
  }

  /* ── Tour viewer ──────────────────────────── */
  .tg__widget--preview {
    flex: 1;
    min-height: 300px;
    display: flex;
    flex-direction: column;
  }

  .tg__viewer {
    position: relative;
    display: flex;
    align-items: stretch;
    background: #111;
    flex: 1;
    min-height: 0;
  }

  .tg__viewer-frame {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 300px;
    background: #0a0a0a;
  }

  .tg__viewer-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .tg__nav-btn {
    flex-shrink: 0;
    width: 44px;
    height: 100%;
    background: rgba(0, 0, 0, 0.55);
    border: none;
    color: rgba(255, 255, 255, 0.85);
    font-size: 28px;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast), color var(--transition-fast);
    z-index: 2;
  }
  .tg__nav-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
  }
  .tg__nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  /* Info bar below viewer */
  .tg__viewer-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    background: #1a1a1a;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tg__viewer-room {
    font-size: var(--text-sm);
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.02em;
  }

  .tg__angle-bar {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .tg__angle-dot {
    font-size: 13px;
    color: rgba(255,255,255,0.25);
    transition: color var(--transition-fast), transform var(--transition-fast);
    cursor: default;
  }

  .tg__angle-dot--active {
    color: var(--color-accent);
    transform: scale(1.3);
  }

  .tg__viewer-counter {
    font-size: 11px;
    font-family: monospace;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.05em;
  }

  /* ── Filmstrip ─────────────────────────────── */
  .tg__filmstrip {
    display: flex;
    gap: 3px;
    padding: var(--space-2) var(--space-3);
    overflow-x: auto;
    background: #151515;
    align-items: flex-end;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }

  .tg__film-room-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.3);
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    padding: var(--space-1) 1px;
    flex-shrink: 0;
    align-self: stretch;
    display: flex;
    align-items: center;
  }

  .tg__film-item {
    flex-shrink: 0;
    width: 68px;
    position: relative;
  }

  .tg__film-item--active .tg__film-img-wrap {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
    border-radius: calc(var(--radius-sm) + 1px);
  }

  .tg__film-img-wrap {
    position: relative;
    border-radius: var(--radius-sm);
    overflow: hidden;
    cursor: pointer;
  }

  .tg__film-thumb {
    display: block;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    position: relative;
  }

  .tg__film-thumb img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    transition: filter var(--transition-fast);
  }

  .tg__film-img-wrap:hover .tg__film-thumb img {
    filter: brightness(0.6);
  }

  .tg__film-angle {
    position: absolute;
    bottom: 3px;
    right: 4px;
    font-size: 9px;
    color: rgba(255,255,255,0.7);
    pointer-events: none;
  }

  /* Overlay on filmstrip thumbnails */
  .tg__preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .tg__film-img-wrap:hover .tg__preview-overlay {
    opacity: 1;
  }

  .tg__preview-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
  }
  .tg__preview-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .tg__preview-btn--regen {
    background: rgba(255, 255, 255, 0.92);
    color: var(--color-accent);
  }
  .tg__preview-btn--regen:hover:not(:disabled) {
    background: #fff;
    transform: rotate(-30deg);
  }
  .tg__preview-btn--del {
    background: rgba(255, 255, 255, 0.92);
    color: #dc3545;
  }
  .tg__preview-btn--del:hover:not(:disabled) {
    background: #dc3545;
    color: #fff;
  }

  .tg__preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-10) var(--space-6);
    text-align: center;
    flex: 1;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.96); }
    50% { opacity: 0.7; transform: scale(1); }
  }

  .tg__preview-pulse {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-accent);
    animation: pulse 1.4s ease-in-out infinite;
  }

  .tg__preview-placeholder p {
    font-size: var(--text-sm);
    color: var(--color-text-body);
    margin: 0;
  }

  .tg__preview-hint {
    font-size: var(--text-xs) !important;
    color: var(--color-text-body);
    opacity: 0.6;
  }

  .tg__preview-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-10) var(--space-6);
    color: var(--color-text-body);
    text-align: center;
    flex: 1;
  }

  .tg__preview-empty p {
    font-size: var(--text-sm);
    margin: 0;
    line-height: 1.6;
  }

  /* Empty state (nothing selected) */
  .tg__empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-20) var(--space-6);
    border: 1px dashed var(--color-border, #e8e4de);
    border-radius: var(--radius-lg);
    color: var(--color-text-body);
    text-align: center;
  }

  .tg__empty-state p {
    font-size: var(--text-sm);
    margin: 0;
    line-height: 1.7;
  }

  @media (max-width: 1100px) {
    .tg__layout { grid-template-columns: 200px 1fr; }
  }

  @media (max-width: 800px) {
    .tg__layout { grid-template-columns: 1fr; grid-template-rows: 280px 1fr; }
    .tg__list { min-height: 0; }
  }
</style>
