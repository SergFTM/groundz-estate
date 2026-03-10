<script lang="ts">
  import ArticleCard from '$lib/components/ArticleCard.svelte';

  let { data } = $props();
  let { article, related } = $derived(data);

  let dateStr = $derived(
    new Date(article.publishedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );
</script>

<svelte:head>
  <title>{article.title} — Develta</title>
  <meta name="description" content={article.excerpt ?? article.title} />
</svelte:head>

<article class="article-page">
  <div class="container">
    <a href="/knowledge" class="back-link">← Knowledge Base</a>

    <header class="article-header">
      <span class="article-category">{article.category}</span>
      <h1 class="article-title">{article.title}</h1>
      <time class="article-date">{dateStr}</time>
    </header>

    <div class="article-content prose">
      {@html article.content}
    </div>

    {#if related.length > 0}
      <section class="related">
        <h2 class="related-title">Related Articles</h2>
        <div class="related-grid">
          {#each related as r}
            <ArticleCard
              slug={r.slug}
              title={r.title}
              category={r.category}
              publishedAt={r.publishedAt}
              excerpt={r.excerpt}
              imageUrl={r.imageUrl}
            />
          {/each}
        </div>
      </section>
    {/if}
  </div>
</article>

<style>
  .article-page {
    padding: var(--space-16) 0 var(--space-20);
  }

  .container {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .back-link {
    display: inline-block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: var(--space-8);
  }

  .back-link:hover { color: var(--color-accent); }

  .article-header {
    margin-bottom: var(--space-10);
    padding-bottom: var(--space-8);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .article-category {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-accent);
    margin-bottom: var(--space-3);
  }

  .article-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    line-height: 1.2;
    margin: 0 0 var(--space-4);
  }

  .article-date {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .prose :global(p) {
    font-size: var(--text-base);
    line-height: 1.8;
    color: var(--color-text);
    margin: 0 0 var(--space-5);
  }

  .prose :global(h3) {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: var(--space-8) 0 var(--space-4);
  }

  .prose :global(ul) {
    padding-left: var(--space-6);
    margin: 0 0 var(--space-5);
  }

  .prose :global(li) {
    font-size: var(--text-base);
    line-height: 1.7;
    color: var(--color-text);
    margin-bottom: var(--space-2);
  }

  .related {
    margin-top: var(--space-16);
    padding-top: var(--space-10);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    max-width: 100%;
  }

  .related-title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-6);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
  }

  @media (max-width: 700px) {
    .related-grid { grid-template-columns: 1fr; }
    .container { max-width: 100%; }
  }
</style>
