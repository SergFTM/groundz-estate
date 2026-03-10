<script lang="ts">
  import JobCard from '$lib/components/JobCard.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Careers — Develta</title>
  <meta name="description" content="Join the Develta team and help shape the future of real estate in Limassol, Cyprus." />
</svelte:head>

<section class="jobs-section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">CAREERS</span>
      <h2 class="section-title">Join Our Team</h2>
    </div>

    {#if data.jobs.length === 0}
      <p class="empty">No open positions at this time. Check back soon.</p>
    {:else}
      <div class="jobs-grid">
        {#each data.jobs as job}
          <JobCard
            slug={job.slug}
            title={job.title}
            department={job.department}
            type={job.type}
            location={job.location}
          />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .jobs-section {
    padding: var(--space-20) 0;
    min-height: 60vh;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .section-header {
    margin-bottom: var(--space-12);
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

  .jobs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-5);
  }

  @media (max-width: 640px) {
    .jobs-grid { grid-template-columns: 1fr; }
  }

  .empty {
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-16) 0;
  }
</style>
