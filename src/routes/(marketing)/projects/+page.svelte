<script lang="ts">
  import ProjectCard from '$lib/components/ProjectCard.svelte';

  let { data } = $props();

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
</style>
