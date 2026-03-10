<script lang="ts">
  import ArticleCard from '$lib/components/ArticleCard.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Knowledge Base — Develta</title>
  <meta name="description" content="Expert insights on Cyprus real estate investment, market trends, and buying guides." />
</svelte:head>

<section class="knowledge-section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">KNOWLEDGE BASE</span>
      <h2 class="section-title">Expert Insights</h2>
    </div>

    <div class="articles-grid">
      {#each data.articles as article}
        <ArticleCard
          slug={article.slug}
          title={article.title}
          category={article.category}
          publishedAt={article.publishedAt}
          excerpt={article.excerpt}
          imageUrl={article.imageUrl}
        />
      {/each}
    </div>
  </div>
</section>

<style>
  .knowledge-section {
    padding: var(--space-20) 0;
    min-height: 60vh;
  }

  .container {
    max-width: 1200px;
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

  .articles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }

  @media (max-width: 900px) {
    .articles-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 600px) {
    .articles-grid { grid-template-columns: 1fr; }
  }
</style>
