<script lang="ts">
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import MetricTooltip from '$lib/components/invest/MetricTooltip.svelte';
  import MarketChart from '$lib/components/market/MarketChart.svelte';

  let { data } = $props();

  function fmt(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `€${Math.round(n / 1000)}k`;
    return `€${n}`;
  }

  function pct(raised: number, goal: number): number {
    return goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  }

  // ── Market Indices Widget ──────────────────────────────────────────────
  const MARKET_TABS = [
    { value: 'global',  label: 'Global' },
    { value: 'europe',  label: 'Europe' },
    { value: 'cyprus',  label: 'Cyprus' },
    { value: 'georgia', label: 'Georgia' },
    { value: 'dubai',   label: 'Dubai' },
    { value: 'turkey',  label: 'Turkey' },
  ];

  // Map market → first active index
  const indexByMarket = $derived(
    Object.fromEntries(
      MARKET_TABS.map(t => [
        t.value,
        data.indices.find(i => i.market === t.value) ?? null,
      ])
    )
  );

  // Only show tabs that have an active index
  const visibleTabs = $derived(MARKET_TABS.filter(t => indexByMarket[t.value] !== null));

  let activeMarket = $state(visibleTabs[0]?.value ?? 'global');
  const activeIndex = $derived(indexByMarket[activeMarket] ?? null);

  // Period selector
  type Period = '1Y' | '5Y' | '10Y' | 'MAX';
  let selectedPeriod = $state<Period>('1Y');

  // Prices for chart: server data for 1Y, fetched client-side for longer periods
  let extendedPrices = $state<{ date: string; close: number }[] | null>(null);
  let loadingPrices = $state(false);

  const chartPrices = $derived.by(() => {
    if (selectedPeriod === '1Y') {
      return (activeIndex?.prices ?? []).map(p => ({
        date: new Date(p.date).toISOString().slice(0, 10),
        close: p.close,
      }));
    }
    return extendedPrices ?? [];
  });

  async function loadPrices(period: Period) {
    if (!activeIndex) return;
    if (period === '1Y') { extendedPrices = null; return; }
    loadingPrices = true;
    try {
      const res = await fetch(`/api/market/prices?indexId=${activeIndex.id}&period=${period}`);
      const json = await res.json();
      extendedPrices = json.prices ?? [];
    } catch { extendedPrices = []; }
    finally { loadingPrices = false; }
  }

  $effect(() => {
    // reset extended prices when switching index
    extendedPrices = null;
    selectedPeriod = '1Y';
  });

  async function selectPeriod(p: Period) {
    selectedPeriod = p;
    await loadPrices(p);
  }

  // Current price info
  const currentPrice = $derived.by(() => {
    const prices = activeIndex?.prices ?? [];
    return prices.length > 0 ? prices[prices.length - 1] : null;
  });

  const changePct = $derived.by(() => {
    if (!currentPrice) return null;
    if (currentPrice.changePct != null) return currentPrice.changePct;
    const prices = activeIndex?.prices ?? [];
    if (prices.length < 2) return null;
    const prev = prices[prices.length - 2].close;
    return prev > 0 ? ((currentPrice.close - prev) / prev) * 100 : null;
  });

  const currencySymbol = $derived(activeMarket === 'europe' ? '€' : '$');

  // AI insight state
  let aiInsight = $state<{ what: string; context: string; comparison: string } | null>(null);
  let aiLoading = $state(false);
  let aiError = $state<string | null>(null);
  let aiOpen = $state(false);

  // Reset AI state when switching index
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    activeIndex?.id;
    aiInsight = null;
    aiError = null;
    aiOpen = false;
  });

  async function loadAiInsight() {
    if (!activeIndex || aiInsight || aiLoading) return;
    aiLoading = true;
    aiError = null;
    aiOpen = true;
    try {
      const res = await fetch('/api/market/ai-insight', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ indexId: activeIndex.id }),
      });
      const json = await res.json();
      if (json.error) { aiError = json.error; return; }
      aiInsight = { what: json.what, context: json.context, comparison: json.comparison };
    } catch (e) {
      aiError = 'Failed to load analysis.';
    } finally {
      aiLoading = false;
    }
  }

  // ── Pools filters ──────────────────────────────────────────────────────
  const DEAL_TYPES = [
    { value: '', label: 'All' },
    { value: 'equity', label: 'Equity Pools' },
    { value: 'debt_note', label: 'Debt Notes' },
    { value: 'rental', label: 'Rental Income' },
    { value: 'club_deal', label: 'Club Deals' },
  ];

  const COUNTRIES = ['', 'Cyprus', 'Georgia', 'Greece', 'Spain'];

  let activeDealType = $state(data.filters.dealType);
  let activeCountry = $state(data.filters.country);

  function applyFilters() {
    const p = new URLSearchParams();
    if (activeDealType) p.set('dealType', activeDealType);
    if (activeCountry) p.set('country', activeCountry);
    const qs = p.toString();
    window.location.href = `/investment${qs ? '?' + qs : ''}`;
  }
</script>

<svelte:head>
  <title>Investment Opportunities — Develta</title>
  <meta name="description" content="Access curated development pools in Cyprus with structured yields, milestone tracking and transparent governance." />
</svelte:head>

<!-- Hero -->
<section class="invest-hero">
  <div class="container">
    <span class="invest-hero__label">INVESTMENT</span>
    <h1 class="invest-hero__title">Access Curated<br><em>Development Pools</em></h1>
    <p class="invest-hero__sub">Structured yields, milestone tracking, and transparent governance — co-invest in premium developments across Cyprus and beyond.</p>
    <div class="invest-hero__ctas">
      <a href="#pools" class="btn-primary">Explore Pools</a>
      <a href="/contact" class="btn-outline">Talk to Our Team</a>
    </div>
  </div>
</section>

<!-- Trust Bar -->
<section class="trust-bar">
  <div class="container">
    <div class="trust-bar__grid">
      <div class="trust-item">
        <span class="trust-item__value">{fmt(data.trustBar.totalAum)}</span>
        <span class="trust-item__label">Total AUM</span>
      </div>
      <div class="trust-item">
        <span class="trust-item__value">{fmt(data.trustBar.totalRaised)}</span>
        <span class="trust-item__label">Capital Raised</span>
      </div>
      <div class="trust-item">
        <span class="trust-item__value">{data.trustBar.activeInvestors}</span>
        <span class="trust-item__label">Active Investors</span>
      </div>
      <div class="trust-item">
        <div class="trust-item__value-row">
          <span class="trust-item__value">{data.trustBar.avgIrr}%</span>
          <MetricTooltip metric="targetIrr" value="{data.trustBar.avgIrr}% avg" poolContext={null} />
        </div>
        <span class="trust-item__label">Avg. Target IRR</span>
      </div>
      <div class="trust-item">
        <span class="trust-item__value">{data.trustBar.avgTermMonths}m</span>
        <span class="trust-item__label">Avg. Term</span>
      </div>
      <div class="trust-item">
        <span class="trust-item__value">{fmt(data.trustBar.minTicket)}</span>
        <span class="trust-item__label">Min. Ticket</span>
      </div>
    </div>
  </div>
</section>

<!-- Market Indices Widget -->
{#if visibleTabs.length > 0}
<section class="indices-section">
  <div class="container">
    <div class="indices-header">
      <h2 class="indices-title">Real Estate Market Indices</h2>
      <p class="indices-sub">Track global real estate markets and understand how direct investment compares</p>
    </div>

    <!-- Market tabs -->
    <div class="indices-tabs">
      {#each visibleTabs as tab}
        <button
          class="indices-tab"
          class:indices-tab--active={activeMarket === tab.value}
          onclick={() => { activeMarket = tab.value; }}
        >{tab.label}</button>
      {/each}
    </div>

    {#if activeIndex}
      <div class="index-card">
        <!-- Card header -->
        <div class="index-card__header">
          <div class="index-card__title-row">
            <span class="index-card__symbol">{activeIndex.symbol}</span>
            <span class="index-card__name">{activeIndex.name}</span>
          </div>
          <div class="index-card__price-row">
            {#if currentPrice}
              <span class="index-card__price">
                {currencySymbol}{currentPrice.close.toFixed(2)}
              </span>
              {#if changePct != null}
                <span class="index-card__change" class:index-card__change--up={changePct >= 0} class:index-card__change--down={changePct < 0}>
                  {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              {/if}
            {:else}
              <span class="index-card__no-data">No data — sync required</span>
            {/if}
          </div>
        </div>

        <!-- Chart -->
        <div class="index-card__chart">
          {#if loadingPrices}
            <div class="index-card__chart-loading">Loading data…</div>
          {:else if chartPrices.length > 0}
            <MarketChart
              prices={chartPrices}
              color={activeIndex.color}
              showCrisisBand={true}
            />
          {:else}
            <div class="index-card__chart-empty">No price data yet — run initial sync from admin panel</div>
          {/if}
        </div>

        <!-- Period selector -->
        <div class="index-card__periods">
          {#each (['1Y', '5Y', '10Y', 'MAX'] as Period[]) as p}
            <button
              class="period-btn"
              class:period-btn--active={selectedPeriod === p}
              onclick={() => selectPeriod(p)}
            >{p}</button>
          {/each}
        </div>

        <!-- AI Analysis panel -->
        <div class="index-card__ai">
          {#if !aiOpen}
            <button class="ai-trigger" onclick={loadAiInsight}>
              ✦ AI Analysis
            </button>
          {:else}
            <div class="ai-panel">
              {#if aiLoading}
                <div class="ai-panel__loading">
                  <span class="ai-spinner"></span>
                  Generating analysis…
                </div>
              {:else if aiError}
                <p class="ai-panel__error">{aiError}</p>
              {:else if aiInsight}
                <div class="ai-panel__content" class:ai-panel__content--blurred={!data.isLoggedIn}>
                  <div class="ai-section">
                    <span class="ai-section__label">What is this?</span>
                    <p class="ai-section__text">{aiInsight.what}</p>
                  </div>
                  <div class="ai-section">
                    <span class="ai-section__label">Market context</span>
                    <p class="ai-section__text">{aiInsight.context}</p>
                  </div>
                  <div class="ai-section">
                    <span class="ai-section__label">vs. Direct investment via Develta</span>
                    <p class="ai-section__text">{aiInsight.comparison}</p>
                  </div>
                </div>
                {#if !data.isLoggedIn}
                  <div class="ai-panel__gate">
                    <p class="ai-panel__gate-text">Want this analysis for your portfolio?</p>
                    <a href="/register" class="ai-panel__gate-cta">Register free to read full analysis →</a>
                  </div>
                {/if}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</section>
{/if}

<!-- Filters & Pools -->
<section class="pools-section" id="pools">
  <div class="container">
    <!-- Deal type tabs -->
    <div class="deal-tabs">
      {#each DEAL_TYPES as dt}
        <button
          class="deal-tab"
          class:deal-tab--active={activeDealType === dt.value}
          onclick={() => { activeDealType = dt.value; applyFilters(); }}
        >
          {dt.label}
        </button>
      {/each}
    </div>

    <!-- Country filter -->
    <div class="filters-row">
      <span class="filters-row__label">Country:</span>
      {#each COUNTRIES as c}
        <button
          class="filter-chip"
          class:filter-chip--active={activeCountry === c}
          onclick={() => { activeCountry = c; applyFilters(); }}
        >
          {c || 'All'}
        </button>
      {/each}
    </div>

    <!-- Compare link -->
    <div style="text-align:right;margin-bottom:var(--space-2);">
      <a href="/investment/compare" style="font-size:var(--text-xs);font-weight:700;color:var(--color-accent);text-decoration:none;opacity:0.8;">
        ⇄ Compare pools side-by-side
      </a>
    </div>

    <!-- Pool grid -->
    {#if data.pools.length === 0}
      <div class="pools-empty">
        <p>No pools match the selected filters.</p>
        <a href="/investment" class="btn-outline">Reset filters</a>
      </div>
    {:else}
      <div class="pools-grid">
        {#each data.pools as pool}
          {@const progress = pct(pool.raisedAmount, pool.goalAmount)}
          {@const irr = pool.targetIrr ?? pool.targetYield}
          <a
            href={pool.slug ? `/investment/${pool.slug}` : '/contact'}
            class="pool-card"
          >
            <div
              class="pool-card__image"
              class:pool-card__image--placeholder={!pool.imageUrl}
              style={pool.imageUrl ? `background-image:url('${pool.imageUrl}')` : ''}
            >
              <StatusBadge status={pool.status} />
            </div>

            <div class="pool-card__body">
              <div class="pool-card__head">
                <h3 class="pool-card__name">{pool.name}</h3>
                <p class="pool-card__location">
                  {pool.city ? `${pool.city}, ` : ''}{pool.country}
                </p>
              </div>

              <div class="pool-card__metrics">
                <div class="metric">
                  <div class="metric__value-row">
                    <span class="metric__value metric__value--accent">{irr}%</span>
                    <MetricTooltip metric="targetIrr" value="{irr}%" poolContext={pool} small={true} />
                  </div>
                  <span class="metric__label">Target IRR</span>
                </div>
                {#if pool.preferredReturn}
                  <div class="metric">
                    <div class="metric__value-row">
                      <span class="metric__value">{pool.preferredReturn}%</span>
                      <MetricTooltip metric="preferredReturn" value="{pool.preferredReturn}%" poolContext={pool} small={true} />
                    </div>
                    <span class="metric__label">Pref. Return</span>
                  </div>
                {/if}
                <div class="metric">
                  <span class="metric__value">{pool.termMonths}m</span>
                  <span class="metric__label">Term</span>
                </div>
                <div class="metric">
                  <div class="metric__value-row">
                    <span class="metric__value">{fmt(pool.minTicket)}</span>
                    <MetricTooltip metric="minTicket" value={fmt(pool.minTicket)} poolContext={pool} small={true} />
                  </div>
                  <span class="metric__label">Min. Ticket</span>
                </div>
              </div>

              {#if pool.capitalType || pool.exitType || pool.developerCoinvestPct}
                <div class="pool-card__tags">
                  {#if pool.capitalType}
                    <span class="tag">{pool.capitalType.replace('_', ' ')}</span>
                  {/if}
                  {#if pool.exitType}
                    <span class="tag">Exit: {pool.exitType}</span>
                  {/if}
                  {#if pool.developerCoinvestPct}
                    <span class="tag tag--highlight">Dev. {pool.developerCoinvestPct}% co-invest</span>
                  {/if}
                </div>
              {/if}

              <div class="pool-card__progress">
                <ProgressBar value={progress} showPercent={false} />
                <div class="pool-card__progress-row">
                  <span>{fmt(pool.raisedAmount)} raised</span>
                  <div class="pool-card__progress-right">
                    <span class="pool-card__investors">{pool._count.investments} investors</span>
                    <span>of {fmt(pool.goalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6); }

  /* Hero */
  .invest-hero {
    padding: var(--space-20) 0 var(--space-16);
    background: linear-gradient(160deg, #f8f5f0 0%, #fff 60%);
  }
  .invest-hero__label {
    font-size: var(--text-xs); font-weight: 800; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--color-accent);
    display: block; margin-bottom: var(--space-3);
  }
  .invest-hero__title {
    font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 300;
    font-family: 'IvyoraDisplay', serif; color: var(--color-text);
    margin: 0 0 var(--space-4); line-height: 1.1;
  }
  .invest-hero__title em { font-style: italic; color: var(--color-accent); }
  .invest-hero__sub {
    font-size: var(--text-lg); color: var(--color-text-muted);
    max-width: 560px; line-height: 1.6; margin: 0 0 var(--space-8);
  }
  .invest-hero__ctas { display: flex; gap: var(--space-4); flex-wrap: wrap; }

  .btn-primary {
    background: var(--color-accent); color: #fff;
    padding: var(--space-3) var(--space-6); border-radius: var(--radius-md);
    font-size: var(--text-sm); font-weight: 700; text-decoration: none;
    transition: opacity var(--transition-fast);
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-outline {
    border: 1.5px solid var(--color-accent); color: var(--color-accent);
    padding: var(--space-3) var(--space-6); border-radius: var(--radius-md);
    font-size: var(--text-sm); font-weight: 700; text-decoration: none; background: transparent;
    transition: background var(--transition-fast);
  }
  .btn-outline:hover { background: rgba(180,140,90,0.06); }

  /* Trust Bar */
  .trust-bar { background: var(--color-text); padding: var(--space-8) 0; }
  .trust-bar__grid {
    display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-6);
  }
  .trust-item { text-align: center; }
  .trust-item__value {
    display: block; font-size: var(--text-xl); font-weight: 800;
    color: #fff; font-family: 'IvyoraDisplay', serif; font-style: italic;
  }
  .trust-item__value-row {
    display: flex; align-items: center; justify-content: center; gap: 4px;
  }
  .trust-item__label {
    display: block; font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(255,255,255,0.5); margin-top: 4px;
  }

  /* Pools section */
  .pools-section { padding: var(--space-16) 0 var(--space-20); }

  .deal-tabs {
    display: flex; gap: 4px;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-6); overflow-x: auto;
  }
  .deal-tab {
    background: none; border: none;
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm); font-weight: 600;
    color: var(--color-text-muted); cursor: pointer;
    white-space: nowrap; border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: color var(--transition-fast);
  }
  .deal-tab--active { color: var(--color-text); border-bottom-color: var(--color-accent); }
  .deal-tab:hover:not(.deal-tab--active) { color: var(--color-text); }

  .filters-row {
    display: flex; align-items: center; gap: var(--space-2);
    margin-bottom: var(--space-8); flex-wrap: wrap;
  }
  .filters-row__label {
    font-size: var(--text-xs); font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }
  .filter-chip {
    background: none; border: 1px solid var(--color-border);
    border-radius: 99px; padding: 4px 12px;
    font-size: var(--text-xs); font-weight: 600;
    color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast);
  }
  .filter-chip--active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
  .filter-chip:hover:not(.filter-chip--active) { border-color: var(--color-accent); color: var(--color-accent); }

  .pools-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-6); }
  .pools-empty {
    text-align: center; padding: var(--space-16) 0;
    display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
    color: var(--color-text-muted);
  }

  /* Pool card */
  .pool-card {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: var(--radius-lg); overflow: hidden;
    text-decoration: none; color: inherit;
    display: flex; flex-direction: column;
    transition: box-shadow var(--transition-base), transform var(--transition-base);
  }
  .pool-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.12); transform: translateY(-2px); }

  .pool-card__image {
    height: 160px; background-size: cover; background-position: center;
    background-color: #e8e2d9;
    display: flex; align-items: flex-start; justify-content: flex-end;
    padding: var(--space-3);
  }
  .pool-card__image--placeholder {
    background: linear-gradient(135deg, #e8e2d9, #d4c9b8);
  }

  .pool-card__body {
    padding: var(--space-5); display: flex;
    flex-direction: column; gap: var(--space-4); flex: 1;
  }
  .pool-card__name {
    font-size: var(--text-base); font-weight: 700;
    color: var(--color-text); margin: 0 0 2px;
  }
  .pool-card__location { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0; }

  .pool-card__metrics {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);
  }
  .metric { display: flex; flex-direction: column; gap: 2px; }
  .metric__value-row { display: flex; align-items: center; gap: 3px; }
  .metric__value { font-size: var(--text-base); font-weight: 800; color: var(--color-text); }
  .metric__value--accent { color: var(--color-accent); }
  .metric__label {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--color-text-muted);
  }

  .pool-card__tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag {
    font-size: 10px; font-weight: 600; text-transform: capitalize;
    background: #f0ece6; border: 1px solid #e0d9ce;
    border-radius: 4px; padding: 2px 8px; color: var(--color-text-muted);
  }
  .tag--highlight { background: #fff8ed; border-color: #fad59a; color: #b45309; }

  .pool-card__progress { display: flex; flex-direction: column; gap: var(--space-2); margin-top: auto; }
  .pool-card__progress-row {
    display: flex; justify-content: space-between;
    font-size: var(--text-xs); color: var(--color-text-muted);
  }
  .pool-card__progress-right { display: flex; gap: var(--space-3); }
  .pool-card__investors { color: var(--color-text); font-weight: 600; }

  @media (max-width: 900px) { .trust-bar__grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 700px) {
    .pools-grid { grid-template-columns: 1fr; }
    .trust-bar__grid { grid-template-columns: repeat(2, 1fr); }
    .pool-card__metrics { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Market Indices Widget ─────────────────────────────────────────── */
  .indices-section {
    padding: var(--space-16) 0;
    background: #faf8f5;
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .indices-header { margin-bottom: var(--space-8); }
  .indices-title {
    font-family: 'IvyoraDisplay', serif;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 300; font-style: italic;
    color: var(--color-text); margin: 0 0 var(--space-2);
  }
  .indices-sub {
    font-size: var(--text-sm); color: var(--color-text-muted);
    margin: 0; line-height: 1.5;
  }

  .indices-tabs {
    display: flex; gap: 4px;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-6); overflow-x: auto;
  }
  .indices-tab {
    background: none; border: none;
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm); font-weight: 600;
    color: var(--color-text-muted); cursor: pointer;
    white-space: nowrap; border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: color var(--transition-fast);
  }
  .indices-tab--active { color: var(--color-text); border-bottom-color: var(--color-accent); }
  .indices-tab:hover:not(.indices-tab--active) { color: var(--color-text); }

  .index-card {
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .index-card__header {
    display: flex; align-items: flex-start;
    justify-content: space-between; flex-wrap: wrap;
    gap: var(--space-4); margin-bottom: var(--space-5);
  }
  .index-card__title-row { display: flex; align-items: center; gap: var(--space-3); }
  .index-card__symbol {
    font-size: var(--text-xs); font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    background: var(--color-accent); color: #fff;
    border-radius: 4px; padding: 3px 8px;
  }
  .index-card__name {
    font-size: var(--text-base); font-weight: 600;
    color: var(--color-text);
  }
  .index-card__price-row { display: flex; align-items: center; gap: var(--space-3); }
  .index-card__price {
    font-size: var(--text-xl); font-weight: 800;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
  }
  .index-card__change {
    font-size: var(--text-sm); font-weight: 700;
    padding: 3px 8px; border-radius: 20px;
  }
  .index-card__change--up { background: rgba(34,197,94,0.12); color: #15803d; }
  .index-card__change--down { background: rgba(239,68,68,0.1); color: #dc2626; }
  .index-card__no-data { font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic; }

  .index-card__chart {
    width: 100%; margin-bottom: var(--space-4);
    min-height: 120px; display: flex; align-items: center;
  }
  .index-card__chart > :global(div) { width: 100%; }
  .index-card__chart-loading,
  .index-card__chart-empty {
    width: 100%; text-align: center;
    font-size: var(--text-sm); color: var(--color-text-muted);
    padding: var(--space-10) 0; font-style: italic;
  }

  .index-card__periods {
    display: flex; gap: 4px;
    margin-bottom: var(--space-5);
  }
  .period-btn {
    background: none; border: 1px solid var(--color-border);
    border-radius: 4px; padding: 4px 12px;
    font-size: var(--text-xs); font-weight: 700;
    color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast);
  }
  .period-btn--active {
    background: var(--color-accent); border-color: var(--color-accent);
    color: #fff;
  }
  .period-btn:hover:not(.period-btn--active) {
    border-color: var(--color-accent); color: var(--color-accent);
  }

  /* AI panel */
  .ai-trigger {
    background: none; border: 1px solid var(--color-border);
    border-radius: var(--radius-base); padding: var(--space-3) var(--space-5);
    font-size: var(--text-sm); font-weight: 600;
    color: var(--color-accent); cursor: pointer;
    display: inline-flex; align-items: center; gap: var(--space-2);
    transition: all var(--transition-fast);
  }
  .ai-trigger:hover { background: rgba(180,140,90,0.06); border-color: var(--color-accent); }

  .ai-panel {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-5);
    margin-top: var(--space-2);
  }
  .ai-panel__loading {
    display: flex; align-items: center; gap: var(--space-3);
    font-size: var(--text-sm); color: var(--color-text-muted);
  }
  .ai-spinner {
    width: 16px; height: 16px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    display: inline-block;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .ai-panel__error { font-size: var(--text-sm); color: #dc2626; }

  .ai-panel__content {
    display: flex; flex-direction: column; gap: var(--space-4);
    position: relative;
  }
  .ai-panel__content--blurred {
    filter: blur(4px);
    pointer-events: none;
    user-select: none;
  }
  .ai-section { display: flex; flex-direction: column; gap: 4px; }
  .ai-section__label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--color-accent);
  }
  .ai-section__text {
    font-size: var(--text-sm); color: var(--color-text);
    line-height: 1.65; margin: 0;
  }

  .ai-panel__gate {
    display: flex; flex-direction: column; align-items: center;
    gap: var(--space-3); padding: var(--space-4);
    background: rgba(255,255,255,0.9);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    margin-top: var(--space-4); text-align: center;
  }
  .ai-panel__gate-text {
    font-size: var(--text-sm); color: var(--color-text); margin: 0; font-weight: 600;
  }
  .ai-panel__gate-cta {
    font-size: var(--text-sm); font-weight: 700;
    color: #fff; background: var(--color-accent);
    padding: var(--space-2) var(--space-5); border-radius: var(--radius-base);
    text-decoration: none; transition: opacity var(--transition-fast);
  }
  .ai-panel__gate-cta:hover { opacity: 0.85; }
</style>
