<script lang="ts">
  interface Props {
    slug: string;
    title: string;
    category: string;
    publishedAt: Date | string;
    excerpt?: string | null;
    imageUrl?: string | null;
  }

  let { slug, title, category, publishedAt, excerpt, imageUrl }: Props = $props();

  let dateStr = $derived(
    new Date(publishedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  );

  let shortExcerpt = $derived(
    excerpt ? (excerpt.length > 100 ? excerpt.slice(0, 100) + '…' : excerpt) : ''
  );
</script>

<div class="article-card">
  {#if imageUrl}
    <div class="article-card__image">
      <img src={imageUrl} alt={title} />
    </div>
  {/if}
  <div class="article-card__body">
    <span class="article-card__category">{category}</span>
    <h3 class="article-card__title">{title}</h3>
    {#if shortExcerpt}
      <p class="article-card__excerpt">{shortExcerpt}</p>
    {/if}
    <div class="article-card__footer">
      <span class="article-card__date">{dateStr}</span>
      <a href="/knowledge/{slug}" class="article-card__link">Read More →</a>
    </div>
  </div>
</div>

<style>
  .article-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow var(--transition-base);
  }

  .article-card:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .article-card__image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
  }

  .article-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .article-card__body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .article-card__category {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-accent);
  }

  .article-card__title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
  }

  .article-card__excerpt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.6;
    margin: 0;
  }

  .article-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: var(--space-3);
  }

  .article-card__date {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .article-card__link {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
  }

  .article-card__link:hover {
    text-decoration: underline;
  }
</style>
