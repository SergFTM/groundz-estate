<script lang="ts">
  interface TourImage {
    url: string;
    label: string;
    roomIndex?: number;
  }

  interface Props {
    images: TourImage[];
    unitCode: string;
    onclose: () => void;
    floorPlanImage?: string;
  }

  let { images, unitCode, onclose, floorPlanImage }: Props = $props();

  // Lock background scroll while viewer is open
  $effect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  });

  let index = $state(0);
  let current = $derived(images[index]);

  // Current room number (1-based) shown on the minimap badge
  let currentRoom = $derived(
    current.roomIndex != null
      ? current.roomIndex + 1
      : Math.floor(index / 3) + 1
  );

  // ── Drag / swipe ────────────────────────────────────────
  let dragX       = $state(0);
  let isDragging  = $state(false);
  let isAnimating = $state(false);
  let stageEl     = $state<HTMLElement | null>(null);
  let startX      = 0;
  let cachedW     = 0; // stage width captured on pointerdown

  const THRESHOLD = 55;   // px to commit navigation
  const DURATION  = 300;  // ms for spring-back / commit
  const EASE      = `transform ${DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

  // Adjacent image shown peeking in during drag
  let peekIdx = $derived(
    dragX <= 0
      ? (index + 1) % images.length           // drag left → next peeks from right
      : (index - 1 + images.length) % images.length  // drag right → prev peeks from left
  );

  function onPointerDown(e: PointerEvent) {
    if (isAnimating || images.length <= 1) return;
    isDragging = true;
    startX     = e.clientX;
    cachedW    = stageEl?.offsetWidth ?? 900;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    dragX = e.clientX - startX;
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    if (Math.abs(dragX) >= THRESHOLD) {
      commitNav(dragX < 0);
    } else {
      snapBack();
    }
  }

  function snapBack() {
    isAnimating = true;
    dragX = 0;
    setTimeout(() => { isAnimating = false; }, DURATION);
  }

  function commitNav(goNext: boolean) {
    isAnimating = true;
    dragX = goNext ? -cachedW : cachedW; // fly current image out
    setTimeout(() => {
      index       = goNext
        ? (index + 1) % images.length
        : (index - 1 + images.length) % images.length;
      isAnimating = false;
      dragX       = 0;
    }, DURATION);
  }

  // ── Button / keyboard nav ───────────────────────────────
  function prev() { if (!isAnimating) { cachedW = stageEl?.offsetWidth ?? 900; commitNav(false); } }
  function next() { if (!isAnimating) { cachedW = stageEl?.offsetWidth ?? 900; commitNav(true);  } }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Escape') onclose();
  }

  let cursorStyle = $derived(isDragging ? 'grabbing' : 'grab');
  let transition  = $derived(isAnimating ? EASE : 'none');
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="viewer">
    <div class="viewer__header">
      <span class="viewer__unit">{unitCode}</span>
      <span class="viewer__counter">{index + 1} / {images.length}</span>
      <button class="viewer__close" onclick={onclose} aria-label="Close tour">✕</button>
    </div>

    <!-- Stage: drag/swipe here -->
    <div
      class="viewer__stage"
      bind:this={stageEl}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
      style:cursor={cursorStyle}
    >
      <!-- Peek image (slides in from side) -->
      {#if images.length > 1}
        <img
          src={images[peekIdx].url}
          alt={images[peekIdx].label}
          class="viewer__img"
          style:transform="translateX(calc({dragX}px + {dragX <= 0 ? '100%' : '-100%'}))"
          style:transition
          draggable="false"
        />
      {/if}

      <!-- Current image -->
      <img
        src={current.url}
        alt={current.label}
        class="viewer__img"
        style:transform="translateX({dragX}px)"
        style:transition
        draggable="false"
      />

      <button
        class="viewer__nav viewer__nav--prev"
        onclick={prev}
        aria-label="Previous"
        tabindex="-1"
      >‹</button>
      <button
        class="viewer__nav viewer__nav--next"
        onclick={next}
        aria-label="Next"
        tabindex="-1"
      >›</button>

      <!-- Minimap — shows 3D floor plan with current room badge -->
      {#if floorPlanImage}
        <div class="viewer__minimap">
          <img src={floorPlanImage} alt="Floor plan" class="viewer__minimap-img" draggable="false" />
          {#key currentRoom}<div class="viewer__minimap-badge">{currentRoom}</div>{/key}
          <div class="viewer__minimap-label">{current.label}</div>
        </div>
      {/if}
    </div>

    <div class="viewer__footer">
      <span class="viewer__label">{current.label}</span>
      <div class="viewer__dots">
        {#each images as _, i}
          <button
            class="viewer__dot"
            class:viewer__dot--active={i === index}
            onclick={() => { if (!isAnimating) { cachedW = stageEl?.offsetWidth ?? 900; commitNav(i > index); } }}
            aria-label="Go to image {i + 1}"
          ></button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(240, 237, 230, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-5);
    overflow: hidden;
  }

  .viewer {
    background: #fff;
    border: 1px solid rgba(180, 172, 158, 0.35);
    border-radius: 20px;
    width: min(95vw, 1280px);
    max-height: calc(100vh - 48px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 2px 0 0 rgba(255,255,255,0.9) inset,
      0 32px 80px rgba(100, 90, 70, 0.18),
      0 4px 16px rgba(100, 90, 70, 0.10);
  }

  .viewer__header {
    display: flex;
    align-items: center;
    padding: var(--space-4) var(--space-5);
    background: linear-gradient(135deg, #f7f4ef 0%, #eee9e0 100%);
    border-bottom: 1px solid rgba(180, 172, 158, 0.25);
    gap: var(--space-3);
  }

  .viewer__unit {
    font-size: var(--text-sm);
    font-weight: 800;
    font-family: monospace;
    color: var(--color-accent, #5c6e4a);
    flex: 1;
    letter-spacing: 0.06em;
  }

  .viewer__counter {
    font-size: var(--text-xs);
    color: rgba(60, 55, 45, 0.45);
    font-weight: 500;
  }

  .viewer__close {
    background: rgba(100, 90, 70, 0.09);
    border: 1px solid rgba(100, 90, 70, 0.14);
    color: rgba(60, 55, 45, 0.55);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-base), color var(--transition-base);
    flex-shrink: 0;
  }

  .viewer__close:hover {
    background: rgba(100, 90, 70, 0.16);
    color: #2a2620;
  }

  .viewer__stage {
    position: relative;
    aspect-ratio: 16 / 9;
    background: #e8e4dc;
    overflow: hidden;
    user-select: none;
    touch-action: pan-y;
  }

  .viewer__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    position: absolute;
    inset: 0;
    will-change: transform;
    pointer-events: none;
  }

  .viewer__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 253, 248, 0.82);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(180, 172, 158, 0.4);
    color: #3a3630;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-base), opacity var(--transition-base), box-shadow var(--transition-base);
    z-index: 2;
    opacity: 0;
    box-shadow: 0 2px 12px rgba(80, 70, 50, 0.12);
  }

  .viewer__stage:hover .viewer__nav { opacity: 1; }

  .viewer__nav:hover {
    background: rgba(255, 253, 248, 0.96);
    box-shadow: 0 4px 20px rgba(80, 70, 50, 0.18);
  }

  .viewer__nav--prev { left: var(--space-4); }
  .viewer__nav--next { right: var(--space-4); }

  .viewer__footer {
    padding: var(--space-4) var(--space-5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    background: linear-gradient(135deg, #faf8f5 0%, #f0ece4 100%);
    border-top: 1px solid rgba(180, 172, 158, 0.25);
  }

  .viewer__label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: rgba(50, 45, 35, 0.75);
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
  }

  .viewer__dots {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .viewer__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(100, 90, 70, 0.2);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background var(--transition-base), transform var(--transition-base);
  }

  .viewer__dot--active {
    background: var(--color-accent, #5c6e4a);
    transform: scale(1.35);
  }

  /* ── Minimap ────────────────────────────────────── */
  .viewer__minimap {
    position: absolute;
    bottom: var(--space-3);
    right: var(--space-3);
    width: 148px;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 253, 248, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(180, 172, 158, 0.4);
    z-index: 3;
    pointer-events: none;
    box-shadow: 0 4px 20px rgba(80, 70, 50, 0.16);
  }

  .viewer__minimap-img {
    width: 100%;
    display: block;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .viewer__minimap-label {
    padding: 4px 8px 5px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(50, 45, 35, 0.65);
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: linear-gradient(135deg, #f7f4ef, #eee9e0);
  }

  .viewer__minimap-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-accent, #5c6e4a);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(50, 70, 40, 0.35);
    animation: minimap-pulse 0.4s ease;
  }

  @keyframes minimap-pulse {
    0%   { transform: scale(1.5); opacity: 0.6; }
    100% { transform: scale(1);   opacity: 1;   }
  }

  @media (max-width: 600px) {
    .viewer__nav { width: 36px; height: 36px; font-size: 1.2rem; }
    .viewer__minimap { width: 110px; }
  }
</style>
