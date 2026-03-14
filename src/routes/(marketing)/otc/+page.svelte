<!-- src/routes/(marketing)/otc/+page.svelte -->
<script lang="ts">
  let { data } = $props();

  const TYPES = [
    { value: '', label: 'All' },
    { value: 'investment_share', label: 'Investment Shares' },
    { value: 'option_contract', label: 'Option Contracts' },
    { value: 'apartment', label: 'Apartments' },
  ];

  function timeAgo(iso: string) {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  function assetTypeBadge(t: string) {
    if (t === 'investment_share') return 'INVESTMENT SHARE';
    if (t === 'option_contract') return 'OPTION CONTRACT';
    return 'APARTMENT';
  }
</script>

<svelte:head><title>OTC Secondary Market — Develta</title></svelte:head>

<section class="otc-hero">
  <h1 class="otc-hero__title">OTC Secondary Market</h1>
  <p class="otc-hero__subtitle">Early-exit liquidity for Develta investors and buyers</p>
</section>

<div class="otc-layout">
  <!-- Filter tabs -->
  <nav class="otc-tabs">
    {#each TYPES as t}
      <a
        href="/otc{t.value ? `?type=${t.value}` : ''}"
        class="otc-tabs__tab"
        class:otc-tabs__tab--active={data.activeType === t.value}
      >{t.label}</a>
    {/each}
  </nav>

  {#if data.listings.length === 0}
    <p class="otc-empty">No active listings at the moment.</p>
  {:else}
    <div class="otc-grid">
      {#each data.listings as l}
        <article class="otc-card">
          <span class="otc-card__badge">{assetTypeBadge(l.assetType)}</span>
          <h3 class="otc-card__title">{l.title}</h3>
          <p class="otc-card__asset">{l.assetSummary}</p>
          <p class="otc-card__price">Ask: €{l.askPrice.toLocaleString('en')}</p>
          <p class="otc-card__meta">{l.offerCount} offer{l.offerCount !== 1 ? 's' : ''} · listed {timeAgo(l.createdAt)}</p>
          <a href="/otc/{l.id}" class="btn btn--primary btn--sm">View &amp; Make Offer →</a>
        </article>
      {/each}
    </div>
  {/if}

  {#if !data.isLoggedIn}
    <div class="otc-cta">
      <a href="/auth/register">Register free to submit offers on any listing →</a>
    </div>
  {/if}
</div>

<style>
  .otc-hero {
    padding: var(--space-16) var(--space-8) var(--space-8);
    text-align: center;
  }
  .otc-hero__title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    color: var(--color-text);
    margin: 0 0 var(--space-3);
  }
  .otc-hero__subtitle {
    color: var(--color-text-muted);
    font-size: var(--text-lg);
  }
  .otc-layout {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--space-8) var(--space-16);
  }
  .otc-tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-8);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-4);
    flex-wrap: wrap;
  }
  .otc-tabs__tab {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 500;
    transition: color 0.15s, background 0.15s;
  }
  .otc-tabs__tab:hover { color: var(--color-text); background: var(--color-surface); }
  .otc-tabs__tab--active { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
  .otc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-6);
  }
  .otc-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .otc-card__badge {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-accent);
    text-transform: uppercase;
  }
  .otc-card__title { font-size: var(--text-lg); font-weight: 600; margin: 0; color: var(--color-text); }
  .otc-card__asset { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; }
  .otc-card__price { font-size: var(--text-xl); font-weight: 700; color: var(--color-text); margin: 0; }
  .otc-card__meta { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0 0 var(--space-2); }
  .otc-empty { text-align: center; color: var(--color-text-muted); padding: var(--space-16) 0; }
  .otc-cta {
    margin-top: var(--space-12);
    text-align: center;
    padding: var(--space-6);
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  .otc-cta a { color: var(--color-accent); font-weight: 600; text-decoration: none; }
</style>
