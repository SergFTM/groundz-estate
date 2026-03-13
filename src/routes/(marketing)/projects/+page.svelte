<script lang="ts">
  import ProjectCard from '$lib/components/ProjectCard.svelte';

  let { data } = $props();
  let scrollY = $state(0);

  type Filter = 'all' | 'active' | 'coming_soon' | 'completed';
  let activeFilter = $state<Filter>('all');

  let filtered = $derived(
    activeFilter === 'all'
      ? data.projects
      : data.projects.filter((p) => p.status === activeFilter)
  );

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'coming_soon', label: 'Coming Soon' },
    { value: 'completed', label: 'Completed' },
  ];
</script>

<svelte:window bind:scrollY />

<svelte:head>
  <title>Our Projects — Develta</title>
  <meta name="description" content="Explore premium residential developments in Limassol, Cyprus." />
</svelte:head>

<section class="projects-section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">PROJECTS</span>
      <h2 class="section-title">Our Developments</h2>
    </div>

    <div class="filter-tabs">
      {#each filters as f}
        <button
          class="filter-tab"
          class:filter-tab--active={activeFilter === f.value}
          onclick={() => (activeFilter = f.value)}
        >
          {f.label}
        </button>
      {/each}
    </div>

    {#if filtered.length === 0}
      <p class="empty-state">No projects found for this filter.</p>
    {:else}
      <div class="projects-grid">
        {#each filtered as project}
          <ProjectCard
            name={project.name}
            slug={project.slug}
            location={project.location}
            status={project.status}
            imageUrl={project.imageUrl}
            unitCount={project._count.units}
            priceFrom={project.units[0]?.price ?? null}
          />
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- ========== SERVICES ========== -->
<section class="svc-timeline-section">
  <div class="svc-parallax-bg" style="transform: translateY({scrollY * 0.12}px)"></div>
  <div class="svc-timeline-head">
    <span class="section-label">SERVICES</span>
    <h2 class="svc-timeline-title">What We Offer</h2>
  </div>

  <div class="svc-timeline">
    {#each [
      {
        num: '01',
        title: 'Full-cycle Development',
        desc: 'From site selection and design to construction and handover — every stage managed under one roof.',
        img: '/images/tours/cas-101/01-entrance-hall.jpg',
        link: '/about'
      },
      {
        num: '02',
        title: 'Turnkey Apartment Setup',
        desc: 'Fully furnished, ready-to-move-in homes. Custom furniture, built-in appliances, and every detail thoughtfully prepared.',
        img: '/images/tours/cas-101/02-living-room.jpg',
        link: '/about'
      },
      {
        num: '03',
        title: 'Property Management',
        desc: 'Tenant search, booking management, payment collection, and tax handling — a completely hands-off rental experience.',
        img: '/images/tours/cas-101/03-balcony.jpg',
        link: '/about'
      },
      {
        num: '04',
        title: 'Renovation & Interior Design',
        desc: 'Aesthetic and functional interiors tailored to your style, delivered without managing contractors yourself.',
        img: '/images/tours/cas-101/04-kitchen.jpg',
        link: '/about'
      },
      {
        num: '05',
        title: 'Co-Investment Opportunities',
        desc: 'Join development projects with attractive returns. You share both the process and the profit with full transparency.',
        img: '/images/tours/cas-101/05-bedroom.jpg',
        link: '/about'
      },
      {
        num: '06',
        title: 'Legal & Residency Services',
        desc: 'Our partner lawyers guide you through Cyprus property purchase, title deeds, and residency program from start to finish.',
        img: '/images/tours/cas-101/06-bathroom.jpg',
        link: '/about'
      }
    ] as svc, i}
      <div class="svc-tl-item" class:svc-tl-item--right={i % 2 !== 0}>
        <a href={svc.link} class="svc-tl-card">
          <div class="svc-tl-img" style="background-image: url('{svc.img}')"></div>
        </a>
        <div class="svc-tl-node">
          <span class="svc-tl-num">{svc.num}</span>
        </div>
        <div class="svc-tl-text">
          <h3 class="svc-tl-title">{svc.title}</h3>
          <p class="svc-tl-desc">{svc.desc}</p>
          <a href={svc.link} class="svc-tl-link">Learn more →</a>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .projects-section {
    padding: var(--space-20) 0;
    min-height: 60vh;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .section-header {
    margin-bottom: var(--space-10);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-accent);
    display: block;
    margin-bottom: var(--space-2);
  }

  .section-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0;
  }

  .filter-tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-10);
    flex-wrap: wrap;
  }

  .filter-tab {
    padding: var(--space-2) var(--space-5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-full);
    background: transparent;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .filter-tab:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .filter-tab--active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #fff;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }

  @media (max-width: 900px) {
    .projects-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 600px) {
    .projects-grid { grid-template-columns: 1fr; }
  }

  .empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--space-20) 0;
  }

  /* ── Services timeline ── */
  .svc-timeline-section {
    padding: var(--space-20) 0;
    border-top: 1px solid var(--color-border);
    position: relative;
    overflow: hidden;
  }

  .svc-parallax-bg {
    position: absolute;
    inset: -15% 0;
    background: linear-gradient(
      160deg,
      #f5f2ec 0%,
      #edeae2 25%,
      rgba(122, 140, 110, 0.10) 55%,
      #e8e4db 80%,
      #f0ece5 100%
    );
    will-change: transform;
    z-index: 0;
  }

  .svc-timeline-head,
  .svc-timeline {
    position: relative;
    z-index: 1;
  }

  .svc-timeline-head {
    text-align: center;
    margin-bottom: var(--space-14);
  }

  .svc-timeline-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: var(--space-2) 0 0;
  }

  .svc-timeline {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
    position: relative;
  }

  /* Vertical center line */
  .svc-timeline::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-border);
    transform: translateX(-50%);
  }

  .svc-tl-item {
    display: grid;
    grid-template-columns: 1fr 40px 1fr;
    gap: 0;
    margin-bottom: var(--space-10);
    align-items: center;
  }

  /* Default: image left, node center, text right */
  .svc-tl-item .svc-tl-card { grid-column: 1; padding-right: var(--space-4); }
  .svc-tl-item .svc-tl-node { grid-column: 2; }
  .svc-tl-item .svc-tl-text { grid-column: 3; padding-left: var(--space-4); }

  /* Right variant: text left, node center, image right */
  .svc-tl-item--right .svc-tl-text { grid-column: 1; grid-row: 1; padding-left: 0; padding-right: var(--space-4); text-align: right; }
  .svc-tl-item--right .svc-tl-node { grid-column: 2; grid-row: 1; }
  .svc-tl-item--right .svc-tl-card { grid-column: 3; grid-row: 1; padding-right: 0; padding-left: var(--space-4); }

  .svc-tl-node {
    display: flex;
    justify-content: center;
    padding-top: var(--space-3);
    position: relative;
    z-index: 1;
  }

  .svc-tl-num {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-bg);
    border: 1.5px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: var(--color-accent);
  }

  .svc-tl-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: block;
    text-decoration: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
    transition: box-shadow var(--transition-base), transform var(--transition-base);
  }

  .svc-tl-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.16);
    transform: translateY(-2px);
  }

  .svc-tl-img {
    width: 100%;
    aspect-ratio: 16 / 9;
    background-size: cover;
    background-position: center;
  }

  .svc-tl-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-8) var(--space-8);
    border-radius: var(--radius-lg);
    background: linear-gradient(160deg, #fdfaf6 0%, #f7f3ec 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      inset 0 -1px 0 rgba(0, 0, 0, 0.04),
      0 2px 16px rgba(140, 130, 115, 0.10),
      0 0 0 1px rgba(180, 168, 150, 0.18);
    position: relative;
    overflow: hidden;
  }

  .svc-tl-text::before {
    content: '';
    position: absolute;
    inset: 0;
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

  .svc-tl-title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    line-height: 1.25;
  }

  .svc-tl-desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.65;
    margin: 0;
  }

  .svc-tl-link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent);
    text-decoration: none;
  }

  .svc-tl-link:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .svc-timeline::before { left: 20px; transform: none; }
    .svc-tl-item,
    .svc-tl-item--right {
      grid-template-columns: 40px 1fr;
      grid-template-rows: auto auto;
    }
    .svc-tl-item .svc-tl-node,
    .svc-tl-item--right .svc-tl-node { grid-column: 1; grid-row: 1; }
    .svc-tl-item .svc-tl-card,
    .svc-tl-item--right .svc-tl-card { grid-column: 2; grid-row: 1; padding: 0; }
    .svc-tl-item .svc-tl-text,
    .svc-tl-item--right .svc-tl-text { grid-column: 2; grid-row: 2; padding: var(--space-3) 0 0; text-align: left; }
  }
</style>
