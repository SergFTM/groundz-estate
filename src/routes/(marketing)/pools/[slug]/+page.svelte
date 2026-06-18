<script lang="ts">
  import StatusBadge from '$lib/components/cabinet/StatusBadge.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import MetricTooltip from '$lib/components/invest/MetricTooltip.svelte';

  let { data } = $props();
  const { pool, user, myCommit } = data;

  function fmt(n: number): string {
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `€${(n / 1000).toFixed(0)}k`;
    return `€${n}`;
  }

  const progress = pool.goalAmount > 0
    ? Math.min(100, Math.round((pool.raisedAmount / pool.goalAmount) * 100))
    : 0;

  const irr = pool.targetIrr ?? pool.targetYield;
  const latestReport = pool.constructionReports[0] ?? null;

  // Yield scenarios: conservative -3%, base = irr, upside +2%
  const scenarios = [
    { label: 'Conservative', irr: Math.max(0, irr - 3), color: '#6b7280' },
    { label: 'Base Case', irr, color: 'var(--color-accent)' },
    { label: 'Upside', irr: irr + 2, color: '#22a06b' },
  ];

  // AI pool explain
  let aiSummaryLoading = $state(false);
  let aiSummary = $state<string | null>(pool.summary ?? null);

  // AI Pool Assistant (inline chat)
  interface ChatMsg { role: 'user' | 'assistant'; content: string }
  let chatOpen = $state(false);
  let chatMessages = $state<ChatMsg[]>([]);
  let chatInput = $state('');
  let chatLoading = $state(false);

  const CHAT_PILLS = [
    'What are the main risks?',
    'How does the exit strategy work?',
    'Who manages this pool?',
    'Compare IRR to market average',
  ];

  async function sendChat(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg || chatLoading) return;
    chatMessages = [...chatMessages, { role: 'user', content: msg }];
    chatInput = '';
    chatLoading = true;
    try {
      const res = await fetch('/api/invest/pool-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: pool.id,
          message: msg,
          history: chatMessages.slice(-8, -1),
        }),
      });
      const json = await res.json();
      chatMessages = [...chatMessages, { role: 'assistant', content: json.reply ?? json.error ?? 'No response.' }];
    } catch {
      chatMessages = [...chatMessages, { role: 'assistant', content: 'AI unavailable right now.' }];
    } finally {
      chatLoading = false;
    }
  }

  async function explainPool() {
    if (aiSummary) return;
    aiSummaryLoading = true;
    try {
      const res = await fetch('/api/invest/metric-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: 'pool_summary',
          value: pool.name,
          poolContext: {
            id: pool.id, name: pool.name, country: pool.country,
            targetIrr: irr, termMonths: pool.termMonths,
            minTicket: pool.minTicket, dealType: pool.dealType,
            description: pool.description,
          },
        }),
      });
      const data = await res.json();
      aiSummary = data.explanation;
    } catch {
      aiSummary = pool.description ?? 'No summary available.';
    } finally {
      aiSummaryLoading = false;
    }
  }

  const MILESTONE_STATUS_ICON: Record<string, string> = {
    completed: '✅', in_progress: '🔄', delayed: '🔴', pending: '⏳',
  };
</script>

<svelte:head>
  <title>{pool.name} — Investment Pool — Develta</title>
  <meta name="description" content="{pool.description ?? `Invest in ${pool.name} — ${irr}% target IRR, ${pool.termMonths} months term, min ticket ${fmt(pool.minTicket)}.`}" />
</svelte:head>

<!-- Hero -->
<section
  class="pool-hero"
  style={pool.imageUrl ? `background-image: linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.7)), url('${pool.imageUrl}')` : ''}
  class:pool-hero--no-image={!pool.imageUrl}
>
  <div class="container">
    <a href="/investment" class="pool-hero__back">← All Pools</a>
    <div class="pool-hero__meta">
      <StatusBadge status={pool.status} />
      {#if pool.dealType}
        <span class="pool-hero__badge">{pool.dealType.replace('_', ' ')}</span>
      {/if}
    </div>
    <h1 class="pool-hero__title">{pool.name}</h1>
    <p class="pool-hero__location">
      {pool.city ? `${pool.city}, ` : ''}{pool.country}
      {#if pool.spvName}<span class="pool-hero__spv">SPV: {pool.spvName}</span>{/if}
    </p>
  </div>
</section>

<!-- Key Metrics Strip -->
<section class="metrics-strip">
  <div class="container">
    <div class="metrics-strip__grid">
      <div class="kpi">
        <div class="kpi__val-row">
          <span class="kpi__val kpi__val--accent">{irr}%</span>
          <MetricTooltip metric="targetIrr" value="{irr}%" poolContext={pool} />
        </div>
        <span class="kpi__label">Target IRR</span>
      </div>
      {#if pool.preferredReturn}
        <div class="kpi">
          <div class="kpi__val-row">
            <span class="kpi__val">{pool.preferredReturn}%</span>
            <MetricTooltip metric="preferredReturn" value="{pool.preferredReturn}%" poolContext={pool} />
          </div>
          <span class="kpi__label">Pref. Return</span>
        </div>
      {/if}
      <div class="kpi">
        <span class="kpi__val">{pool.termMonths}m</span>
        <span class="kpi__label">Term</span>
      </div>
      <div class="kpi">
        <div class="kpi__val-row">
          <span class="kpi__val">{fmt(pool.minTicket)}</span>
          <MetricTooltip metric="minTicket" value={fmt(pool.minTicket)} poolContext={pool} />
        </div>
        <span class="kpi__label">Min. Ticket</span>
      </div>
      {#if pool.ltv}
        <div class="kpi">
          <div class="kpi__val-row">
            <span class="kpi__val">{pool.ltv}%</span>
            <MetricTooltip metric="ltv" value="{pool.ltv}%" poolContext={pool} />
          </div>
          <span class="kpi__label">LTV</span>
        </div>
      {/if}
      {#if pool.developerCoinvestPct}
        <div class="kpi">
          <div class="kpi__val-row">
            <span class="kpi__val">{pool.developerCoinvestPct}%</span>
            <MetricTooltip metric="developerCoinvestPct" value="{pool.developerCoinvestPct}%" poolContext={pool} />
          </div>
          <span class="kpi__label">Dev. Co-Invest</span>
        </div>
      {/if}
      <div class="kpi">
        <span class="kpi__val">{pool._count.investments}</span>
        <span class="kpi__label">Investors</span>
      </div>
    </div>
  </div>
</section>

<div class="pool-content">
  <div class="container">
    <div class="pool-layout">
      <!-- Left: main content -->
      <div class="pool-main">

        <!-- AI Explain button -->
        <div class="ai-section">
          <div class="ai-section__head">
            <span class="ai-section__label">Investment Memo</span>
            {#if !aiSummary}
              <button class="btn-ai" onclick={explainPool} disabled={aiSummaryLoading}>
                {aiSummaryLoading ? 'Analyzing…' : '✦ Explain this pool'}
              </button>
            {/if}
          </div>
          {#if aiSummary}
            <div class="ai-card">
              <p>{aiSummary}</p>
            </div>
          {:else if pool.description}
            <p class="pool-desc">{pool.description}</p>
          {/if}
        </div>

        <!-- Investment Thesis -->
        {#if pool.locationThesis || pool.demandThesis || pool.exitThesis}
          <div class="section-block">
            <h2 class="section-block__title">Why This Pool</h2>
            <div class="thesis-grid">
              {#if pool.locationThesis}
                <div class="thesis-card">
                  <span class="thesis-card__icon">📍</span>
                  <h3 class="thesis-card__title">Location Thesis</h3>
                  <p>{pool.locationThesis}</p>
                </div>
              {/if}
              {#if pool.demandThesis}
                <div class="thesis-card">
                  <span class="thesis-card__icon">📈</span>
                  <h3 class="thesis-card__title">Demand Thesis</h3>
                  <p>{pool.demandThesis}</p>
                </div>
              {/if}
              {#if pool.constructionThesis}
                <div class="thesis-card">
                  <span class="thesis-card__icon">🏗️</span>
                  <h3 class="thesis-card__title">Construction</h3>
                  <p>{pool.constructionThesis}</p>
                </div>
              {/if}
              {#if pool.exitThesis}
                <div class="thesis-card">
                  <span class="thesis-card__icon">🚪</span>
                  <h3 class="thesis-card__title">Exit Strategy</h3>
                  <p>{pool.exitThesis}</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Yield Scenarios -->
        <div class="section-block">
          <h2 class="section-block__title">Yield Scenarios</h2>
          <div class="scenarios">
            {#each scenarios as s}
              <div class="scenario">
                <div class="scenario__bar-wrap">
                  <div
                    class="scenario__bar"
                    style="height:{Math.max(20, (s.irr / (irr + 4)) * 80)}px; background:{s.color}"
                  ></div>
                </div>
                <span class="scenario__irr" style="color:{s.color}">{s.irr.toFixed(1)}%</span>
                <span class="scenario__label">{s.label}</span>
              </div>
            {/each}
          </div>
          <p class="scenarios__note">Yield scenarios are projections only. Past performance does not guarantee future results.</p>
        </div>

        <!-- Construction Milestones -->
        {#if pool.milestones.length > 0}
          <div class="section-block">
            <h2 class="section-block__title">Construction Milestones</h2>
            {#if latestReport}
              <div class="progress-overview">
                <div class="progress-overview__pct">{latestReport.overallPct}%</div>
                <div class="progress-overview__bar">
                  <ProgressBar value={latestReport.overallPct} showPercent={false} />
                </div>
                <span class="progress-overview__label">Overall completion as of {new Date(latestReport.reportDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
              </div>
            {/if}
            <div class="milestones">
              {#each pool.milestones as m}
                <div class="milestone" class:milestone--completed={m.status === 'completed'} class:milestone--delayed={m.status === 'delayed'}>
                  <span class="milestone__icon">{MILESTONE_STATUS_ICON[m.status] ?? '⏳'}</span>
                  <div class="milestone__content">
                    <span class="milestone__name">{m.name}</span>
                    {#if m.description}<p class="milestone__desc">{m.description}</p>{/if}
                    <div class="milestone__dates">
                      <span>Planned: {new Date(m.plannedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {#if m.actualDate}
                        <span>Completed: {new Date(m.actualDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {/if}
                    </div>
                  </div>
                  {#if m.completionPct > 0}
                    <span class="milestone__pct">{m.completionPct}%</span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Right: Commit sidebar -->
      <aside class="pool-sidebar">
        <!-- Funding progress -->
        <div class="sidebar-card">
          <div class="sidebar-card__head">
            <span class="sidebar-card__label">Funding Progress</span>
            <span class="sidebar-card__pct">{progress}%</span>
          </div>
          <ProgressBar value={progress} showPercent={false} />
          <div class="sidebar-card__amounts">
            <span>{fmt(pool.raisedAmount)} raised</span>
            <span>of {fmt(pool.goalAmount)}</span>
          </div>
          {#if pool.raiseEnd}
            <p class="sidebar-card__deadline">
              Closes: {new Date(pool.raiseEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          {/if}
        </div>

        <!-- Quick stats -->
        <div class="sidebar-card sidebar-card--stats">
          <div class="stat-row">
            <span class="stat-row__label">Capital Type</span>
            <span class="stat-row__val">{pool.capitalType?.replace('_', ' ') ?? '—'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Exit Type</span>
            <span class="stat-row__val">{pool.exitType ?? '—'}</span>
          </div>
          {#if pool.ltc}
            <div class="stat-row">
              <span class="stat-row__label">LTC</span>
              <span class="stat-row__val">{pool.ltc}%</span>
            </div>
          {/if}
          {#if pool.maxTicket}
            <div class="stat-row">
              <span class="stat-row__label">Max Ticket</span>
              <span class="stat-row__val">{fmt(pool.maxTicket)}</span>
            </div>
          {/if}
          <div class="stat-row">
            <span class="stat-row__label">Investors</span>
            <span class="stat-row__val">{pool._count.investments}</span>
          </div>
        </div>

        <!-- CTA -->
        {#if pool.status !== 'active'}
          <div class="commit-cta commit-cta--closed">
            Pool {pool.status === 'completed' ? 'Completed' : 'Closed'}
          </div>
        {:else if myCommit}
          <div class="commit-cta commit-cta--committed">
            ✓ Committed {fmt(myCommit.amount)}
          </div>
          <p class="commit-cta__note" style="text-align:center;">
            Status: <strong>{myCommit.status.replace('_', ' ')}</strong> · Our team will contact you.
          </p>
        {:else if user}
          <a href="/investment/{pool.slug}/commit" class="commit-cta">
            Commit Capital →
          </a>
          <p class="commit-cta__note">Min. ticket {fmt(pool.minTicket)}{pool.maxTicket ? ` · Max ${fmt(pool.maxTicket)}` : ''}.</p>
        {:else}
          <a href="/auth/login?next=/investment/{pool.slug}/commit" class="commit-cta">
            Login to Invest →
          </a>
          <p class="commit-cta__note">Register or login to commit capital. Min. {fmt(pool.minTicket)}.</p>
        {/if}

        <a href="/contact" class="sidebar-link">Have questions? Talk to our team →</a>
      </aside>
    </div>

    <!-- AI Pool Assistant -->
    <div class="pool-chat">
      <button class="pool-chat__toggle" onclick={() => chatOpen = !chatOpen}>
        <span class="pool-chat__toggle-icon">✦</span>
        Ask AI about this pool
        <span class="pool-chat__toggle-arrow">{chatOpen ? '▲' : '▼'}</span>
      </button>

      {#if chatOpen}
        <div class="pool-chat__body">
          {#if chatMessages.length === 0}
            <p class="pool-chat__hint">Ask anything about {pool.name} — financials, risks, exit strategy, milestones.</p>
            <div class="pool-chat__pills">
              {#each CHAT_PILLS as pill}
                <button class="pool-chat__pill" onclick={() => sendChat(pill)}>{pill}</button>
              {/each}
            </div>
          {:else}
            <div class="pool-chat__messages">
              {#each chatMessages as msg}
                <div class="pool-chat__msg pool-chat__msg--{msg.role}">
                  <div class="pool-chat__bubble">{msg.content}</div>
                </div>
              {/each}
              {#if chatLoading}
                <div class="pool-chat__msg pool-chat__msg--assistant">
                  <div class="pool-chat__bubble pool-chat__bubble--loading">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              {/if}
            </div>
          {/if}

          <div class="pool-chat__input-row">
            <input
              class="pool-chat__input"
              bind:value={chatInput}
              placeholder="Ask a question…"
              onkeydown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              disabled={chatLoading}
            />
            <button
              class="pool-chat__send"
              onclick={() => sendChat()}
              disabled={chatLoading || !chatInput.trim()}
            >→</button>
          </div>
        </div>
      {/if}
    </div>

  </div>
</div>

<style>
  .container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6); }

  /* Hero */
  .pool-hero {
    padding: var(--space-16) 0 var(--space-12);
    background: linear-gradient(160deg, #1a1714, #2d2620);
    background-size: cover; background-position: center;
    color: #fff;
  }
  .pool-hero--no-image { background: linear-gradient(160deg, #1a1714, #2d2620); }
  .pool-hero__back {
    display: inline-block; font-size: var(--text-sm);
    color: rgba(255,255,255,0.65); text-decoration: none;
    margin-bottom: var(--space-6); transition: color var(--transition-fast);
  }
  .pool-hero__back:hover { color: #fff; }
  .pool-hero__meta { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
  .pool-hero__badge {
    font-size: 10px; font-weight: 700; text-transform: capitalize;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 4px; padding: 2px 8px; color: rgba(255,255,255,0.9);
  }
  .pool-hero__title {
    font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 300;
    font-family: 'IvyoraDisplay', serif; font-style: italic;
    margin: 0 0 var(--space-2); color: #fff;
  }
  .pool-hero__location {
    font-size: var(--text-sm); color: rgba(255,255,255,0.65);
    display: flex; gap: var(--space-3); align-items: center;
  }
  .pool-hero__spv {
    font-size: 10px; background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 2px 8px; border-radius: 4px;
  }

  /* Metrics strip */
  .metrics-strip { background: var(--color-bg); border-bottom: 1px solid var(--color-border); padding: var(--space-6) 0; }
  .metrics-strip__grid { display: flex; gap: var(--space-10); flex-wrap: wrap; }
  .kpi { display: flex; flex-direction: column; gap: 2px; }
  .kpi__val-row { display: flex; align-items: center; gap: 4px; }
  .kpi__val { font-size: var(--text-xl); font-weight: 800; color: var(--color-text); }
  .kpi__val--accent { color: var(--color-accent); }
  .kpi__label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--color-text-muted);
  }

  /* Content layout */
  .pool-content { padding: var(--space-12) 0 var(--space-20); }
  .pool-layout { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-10); align-items: start; }

  /* Section blocks */
  .section-block {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: var(--radius-lg); padding: var(--space-6);
    margin-bottom: var(--space-6);
  }
  .section-block__title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--color-text-muted);
    margin: 0 0 var(--space-5);
  }

  /* AI section */
  .ai-section {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: var(--radius-lg); padding: var(--space-6);
    margin-bottom: var(--space-6);
  }
  .ai-section__head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: var(--space-4);
  }
  .ai-section__label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--color-text-muted);
  }
  .btn-ai {
    background: rgba(180,140,90,0.1); border: 1px solid var(--color-accent);
    color: var(--color-accent); border-radius: var(--radius-md);
    padding: 4px 12px; font-size: var(--text-xs); font-weight: 700;
    cursor: pointer; transition: background var(--transition-fast);
  }
  .btn-ai:hover:not(:disabled) { background: rgba(180,140,90,0.2); }
  .btn-ai:disabled { opacity: 0.6; cursor: not-allowed; }
  .ai-card {
    background: #fffdf8; border: 1px solid #f0e8d4;
    border-radius: var(--radius-md); padding: var(--space-4);
  }
  .ai-card p { font-size: var(--text-sm); line-height: 1.65; color: var(--color-text); margin: 0; }
  .pool-desc { font-size: var(--text-sm); color: var(--color-text); line-height: 1.7; margin: 0; }

  /* Thesis */
  .thesis-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
  .thesis-card {
    background: #f9f6f1; border: 1px solid #ece5d8;
    border-radius: var(--radius-md); padding: var(--space-4);
  }
  .thesis-card__icon { font-size: 20px; display: block; margin-bottom: var(--space-2); }
  .thesis-card__title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: var(--color-text-muted);
    margin: 0 0 var(--space-2);
  }
  .thesis-card p { font-size: var(--text-sm); color: var(--color-text); line-height: 1.6; margin: 0; }

  /* Yield scenarios */
  .scenarios {
    display: flex; gap: var(--space-8); align-items: flex-end;
    height: 100px; margin-bottom: var(--space-3);
  }
  .scenario { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); flex: 1; }
  .scenario__bar-wrap { display: flex; align-items: flex-end; height: 80px; }
  .scenario__bar { width: 48px; border-radius: var(--radius-sm) var(--radius-sm) 0 0; min-height: 20px; }
  .scenario__irr { font-size: var(--text-lg); font-weight: 800; }
  .scenario__label { font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 600; }
  .scenarios__note { font-size: 10px; color: var(--color-text-muted); margin: 0; font-style: italic; }

  /* Milestones */
  .progress-overview {
    display: flex; align-items: center; gap: var(--space-4);
    margin-bottom: var(--space-5);
  }
  .progress-overview__pct {
    font-size: var(--text-2xl); font-weight: 800;
    color: var(--color-accent); white-space: nowrap;
  }
  .progress-overview__bar { flex: 1; }
  .progress-overview__label { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; }
  .milestones { display: flex; flex-direction: column; gap: var(--space-3); }
  .milestone {
    display: flex; gap: var(--space-3); align-items: flex-start;
    padding: var(--space-3); border-radius: var(--radius-md);
    background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.04);
  }
  .milestone--completed { background: rgba(34,160,107,0.06); border-color: rgba(34,160,107,0.2); }
  .milestone--delayed { background: rgba(229,72,77,0.06); border-color: rgba(229,72,77,0.2); }
  .milestone__icon { font-size: 16px; flex-shrink: 0; margin-top: 2px; }
  .milestone__content { flex: 1; }
  .milestone__name { font-size: var(--text-sm); font-weight: 700; color: var(--color-text); }
  .milestone__desc { font-size: var(--text-xs); color: var(--color-text-muted); margin: 2px 0 0; }
  .milestone__dates {
    display: flex; gap: var(--space-4);
    font-size: 10px; color: var(--color-text-muted); margin-top: 4px;
  }
  .milestone__pct {
    font-size: var(--text-xs); font-weight: 700; color: var(--color-accent);
    white-space: nowrap;
  }

  /* Sidebar */
  .pool-main { min-width: 0; }
  .pool-sidebar {
    display: flex; flex-direction: column; gap: var(--space-4);
    position: sticky; top: calc(var(--header-height, 72px) + var(--space-4));
  }
  .sidebar-card {
    background: rgba(255,255,255,0.65);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: var(--radius-lg); padding: var(--space-5);
    display: flex; flex-direction: column; gap: var(--space-3);
  }
  .sidebar-card__head { display: flex; justify-content: space-between; align-items: center; }
  .sidebar-card__label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--color-text-muted);
  }
  .sidebar-card__pct { font-size: var(--text-lg); font-weight: 800; color: var(--color-accent); }
  .sidebar-card__amounts {
    display: flex; justify-content: space-between;
    font-size: var(--text-xs); color: var(--color-text-muted);
  }
  .sidebar-card__deadline { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0; }

  .stat-row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
  .stat-row__label { color: var(--color-text-muted); }
  .stat-row__val { font-weight: 700; color: var(--color-text); text-transform: capitalize; }

  .commit-cta {
    display: block; text-align: center;
    background: var(--color-accent); color: #fff;
    padding: var(--space-4); border-radius: var(--radius-md);
    font-size: var(--text-sm); font-weight: 700; text-decoration: none;
    transition: opacity var(--transition-fast);
  }
  .commit-cta:hover { opacity: 0.85; }
  .commit-cta--closed {
    background: var(--color-border); color: var(--color-text-muted); cursor: default;
  }
  .commit-cta--closed:hover { opacity: 1; }
  .commit-cta--committed {
    background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.25);
    cursor: default; font-size: var(--text-sm);
  }
  .commit-cta--committed:hover { opacity: 1; }
  .commit-cta__note { font-size: 11px; color: var(--color-text-muted); text-align: center; margin: 0; }
  .sidebar-link {
    font-size: var(--text-xs); color: var(--color-accent); text-align: center;
    text-decoration: none; font-weight: 600;
  }
  .sidebar-link:hover { text-decoration: underline; }

  @media (max-width: 900px) {
    .pool-layout { grid-template-columns: 1fr; }
    .pool-sidebar { position: static; }
    .thesis-grid { grid-template-columns: 1fr; }
  }

  /* AI Pool Assistant */
  .pool-chat {
    margin-top: var(--space-10);
    border: 1px solid rgba(212,169,68,0.25);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .pool-chat__toggle {
    width: 100%; display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-4) var(--space-6);
    background: linear-gradient(135deg, rgba(212,169,68,0.07), rgba(212,169,68,0.03));
    border: none; cursor: pointer; font-size: var(--text-sm); font-weight: 700;
    color: #d4a944; text-align: left; transition: background var(--transition-fast);
  }
  .pool-chat__toggle:hover { background: rgba(212,169,68,0.1); }
  .pool-chat__toggle-icon { font-size: 14px; }
  .pool-chat__toggle-arrow { margin-left: auto; font-size: 10px; }

  .pool-chat__body {
    padding: var(--space-5) var(--space-6);
    background: rgba(255,255,255,0.4);
    border-top: 1px solid rgba(212,169,68,0.12);
  }
  .pool-chat__hint {
    font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-4);
  }
  .pool-chat__pills {
    display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4);
  }
  .pool-chat__pill {
    font-size: var(--text-xs); font-weight: 600;
    background: rgba(212,169,68,0.1); border: 1px solid rgba(212,169,68,0.2);
    border-radius: var(--radius-md); padding: var(--space-1) var(--space-3);
    color: #a07820; cursor: pointer; transition: background var(--transition-fast);
  }
  .pool-chat__pill:hover { background: rgba(212,169,68,0.2); }

  .pool-chat__messages {
    display: flex; flex-direction: column; gap: var(--space-3);
    max-height: 400px; overflow-y: auto; margin-bottom: var(--space-4);
    padding-right: var(--space-1);
  }
  .pool-chat__msg { display: flex; }
  .pool-chat__msg--user { justify-content: flex-end; }
  .pool-chat__msg--assistant { justify-content: flex-start; }
  .pool-chat__bubble {
    max-width: 80%; padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg); font-size: var(--text-sm); line-height: 1.6;
    white-space: pre-wrap;
  }
  .pool-chat__msg--user .pool-chat__bubble {
    background: #d4a944; color: #fff; border-radius: var(--radius-lg) var(--radius-lg) 4px var(--radius-lg);
  }
  .pool-chat__msg--assistant .pool-chat__bubble {
    background: rgba(0,0,0,0.05); color: var(--color-text);
    border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px;
  }
  .pool-chat__bubble--loading {
    display: flex; gap: 4px; align-items: center; padding: var(--space-3) var(--space-4);
  }
  .pool-chat__bubble--loading span {
    width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-muted);
    animation: dot-bounce 1.2s infinite both;
  }
  .pool-chat__bubble--loading span:nth-child(2) { animation-delay: 0.2s; }
  .pool-chat__bubble--loading span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  .pool-chat__input-row {
    display: flex; gap: var(--space-2);
  }
  .pool-chat__input {
    flex: 1; padding: var(--space-3) var(--space-4);
    border: 1px solid rgba(0,0,0,0.12); border-radius: var(--radius-md);
    font-size: var(--text-sm); background: rgba(255,255,255,0.8);
    outline: none; transition: border-color var(--transition-fast);
  }
  .pool-chat__input:focus { border-color: #d4a944; }
  .pool-chat__send {
    padding: var(--space-3) var(--space-4);
    background: #d4a944; color: #fff; border: none; border-radius: var(--radius-md);
    font-size: var(--text-base); font-weight: 700; cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .pool-chat__send:disabled { opacity: 0.45; cursor: default; }
  .pool-chat__send:not(:disabled):hover { opacity: 0.85; }
</style>
