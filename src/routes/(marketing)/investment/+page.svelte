<script lang="ts">
  import InvestmentCard from '$lib/components/InvestmentCard.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Investment Opportunities — Develta</title>
  <meta name="description" content="Co-invest in premium Cyprus real estate developments with transparent yields and professional management." />
</svelte:head>

<section class="investment-section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">INVESTMENT</span>
      <h2 class="section-title">Investment Opportunities</h2>
      <p class="section-intro">Pool your capital with like-minded investors and access premium Limassol real estate at flexible entry points, with institutional-grade management and transparent reporting.</p>
    </div>

    <div class="pools-grid">
      {#each data.pools as pool}
        <InvestmentCard
          name={pool.name}
          projectName={pool.projectName}
          status={pool.status}
          goalAmount={pool.goalAmount}
          raisedAmount={pool.raisedAmount}
          targetYield={pool.targetYield}
          description={pool.description}
        />
      {/each}
    </div>
  </div>
</section>

<style>
  .investment-section {
    padding: var(--space-20) 0;
    min-height: 60vh;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .section-header {
    margin-bottom: var(--space-12);
    max-width: 600px;
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
    margin: 0 0 var(--space-4);
  }

  .section-intro {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    line-height: 1.7;
    margin: 0;
  }

  .pools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }

  @media (max-width: 700px) {
    .pools-grid { grid-template-columns: 1fr; }
  }
</style>
