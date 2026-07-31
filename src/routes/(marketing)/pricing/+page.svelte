<script lang="ts">
  import { locale } from '$lib/stores/locale';
  import { t } from '$lib/i18n';

  let { data } = $props();

  function fmt(n: number): string {
    return `€${n.toLocaleString('en-US')}`;
  }
</script>

<svelte:head>
  <title>Membership & Pricing — GROUNDZ ESTATE</title>
  <meta name="description" content="GROUNDZ ESTATE membership tiers — access levels, ticket limits and perks for tokenized real estate investing." />
</svelte:head>

<section class="pricing">
  <div class="container">
    <header class="pricing__head">
      <h1>{t($locale, 'pricing.title')}</h1>
      <p class="body-lg">{t($locale, 'pricing.subtitle')}</p>
    </header>

    {#if data.tiers.length === 0}
      <div class="pricing__empty">
        <p>{t($locale, 'pricing.empty')} <a href="/pools">{t($locale, 'common.browsePools')} →</a></p>
      </div>
    {:else}
      <div class="pricing__grid">
        {#each data.tiers as tier, i (tier.id)}
          <article class="tier" class:tier--featured={i === 1}>
            {#if i === 1}<span class="tier__badge">{t($locale, 'pricing.popular')}</span>{/if}
            <h2 class="tier__name">{tier.name}</h2>
            <div class="tier__price"><span class="num">{fmt(tier.price)}</span></div>
            <p class="tier__ticket">
              {t($locale, 'pricing.ticket')} <span class="num">{fmt(tier.minTicket)}</span>{#if tier.maxTicket} – <span class="num">{fmt(tier.maxTicket)}</span>{:else}+{/if}
            </p>
            {#if tier.perks.length}
              <ul class="tier__perks">
                {#each tier.perks as perk}<li>{perk}</li>{/each}
              </ul>
            {/if}
            <a href="/pools" class="tier__cta" class:tier__cta--featured={i === 1}>{t($locale, 'pricing.cta')}</a>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .pricing {
    padding: var(--space-24) 0;
    background: var(--color-bg);
  }
  .pricing__head {
    text-align: center;
    max-width: var(--container-narrow);
    margin: 0 auto var(--space-16);
  }
  .pricing__head p {
    color: var(--color-text-body);
    margin-top: var(--space-4);
  }
  .pricing__empty {
    text-align: center;
    color: var(--color-text-muted);
  }
  .pricing__empty a {
    color: var(--color-primary);
    font-weight: 700;
  }
  .pricing__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-6);
    align-items: start;
  }
  .tier {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    background: #fff;
    box-shadow: var(--shadow-card);
    position: relative;
    transition: box-shadow var(--transition-base);
  }
  .tier:hover {
    box-shadow: var(--shadow-card-hover);
  }
  .tier--featured {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-lg);
  }
  .tier__badge {
    position: absolute;
    top: calc(-1 * var(--space-3));
    left: var(--space-8);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
  }
  .tier__name {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-4);
  }
  .tier__price {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: var(--space-2);
  }
  .tier__ticket {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    margin-bottom: var(--space-6);
  }
  .tier__perks {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-8);
    display: grid;
    gap: var(--space-3);
  }
  .tier__perks li {
    padding-left: var(--space-6);
    position: relative;
    color: var(--color-text-body);
    font-size: var(--text-sm);
  }
  .tier__perks li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-primary);
    font-weight: 700;
  }
  .tier__cta {
    display: block;
    text-align: center;
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-md);
    font-weight: 700;
    text-decoration: none;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .tier__cta:hover {
    background: var(--color-primary-light);
  }
  .tier__cta--featured {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
  }
  .tier__cta--featured:hover {
    background: var(--color-primary-hover);
    color: var(--color-primary-contrast);
  }
</style>
