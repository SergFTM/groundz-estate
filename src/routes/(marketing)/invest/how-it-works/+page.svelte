<svelte:head>
  <title>How It Works — Invest with Develta</title>
  <meta name="description" content="Learn how to invest in Develta's real estate pools — from application to exit. Transparent, structured, and professionally managed." />
</svelte:head>

<!-- Hero -->
<section class="hiw-hero">
  <div class="container">
    <a href="/investment" class="hiw-back">← Investment Pools</a>
    <p class="hiw-label">HOW IT WORKS</p>
    <h1 class="hiw-title">Invest in Cyprus Real Estate<br/>Without the Complexity</h1>
    <p class="hiw-sub">Develta pools institutional-grade deals and opens them to qualified private investors with transparent structures, professional management, and digital reporting.</p>
    <div class="hiw-cta-row">
      <a href="/investment" class="btn btn--primary">Browse Pools</a>
      <a href="/invest/apply" class="btn btn--outline">Apply as Investor →</a>
    </div>
  </div>
</section>

<!-- Steps -->
<section class="hiw-steps">
  <div class="container">
    <div class="steps-grid">

      <div class="step">
        <div class="step__num">01</div>
        <h3 class="step__title">Browse & Select a Pool</h3>
        <p class="step__body">Review available investment pools — each with a full data room: deal structure, IRR targets, LTV ratios, developer co-invest %, and milestone timeline. Use our AI comparison tool to evaluate pools side-by-side.</p>
        <a href="/investment" class="step__link">Browse pools →</a>
      </div>

      <div class="step">
        <div class="step__num">02</div>
        <h3 class="step__title">Submit a Soft Commit</h3>
        <p class="step__body">Register your interest by submitting a soft commitment — no funds transferred at this stage. Our team will contact you to confirm eligibility, discuss the deal, and answer questions.</p>
      </div>

      <div class="step">
        <div class="step__num">03</div>
        <h3 class="step__title">KYC & Documentation</h3>
        <p class="step__body">Complete a simple KYC process: passport, proof of address, and proof of funds. All documents are handled securely via your investor portal. Most investors complete KYC in under 24 hours.</p>
      </div>

      <div class="step">
        <div class="step__num">04</div>
        <h3 class="step__title">Wire Funds to SPV</h3>
        <p class="step__body">Transfer your committed amount to the pool's dedicated Special Purpose Vehicle (SPV). Each pool is legally isolated — your investment is ringfenced from other Develta projects.</p>
      </div>

      <div class="step">
        <div class="step__num">05</div>
        <h3 class="step__title">Monitor via Investor Portal</h3>
        <p class="step__body">Track construction progress, milestone completions, and budget variance in real time. Get AI-powered cashflow projections and risk alerts. Download documents from the secure data room.</p>
        <a href="/investor" class="step__link">See the portal →</a>
      </div>

      <div class="step">
        <div class="step__num">06</div>
        <h3 class="step__title">Exit & Receive Returns</h3>
        <p class="step__body">At the end of the agreed term — typically 12–36 months — the pool exits via sale or refinance. Your principal plus accrued returns are distributed via the SPV directly to your bank account.</p>
      </div>

    </div>
  </div>
</section>

<!-- Deal types -->
<section class="deal-types">
  <div class="container">
    <h2 class="section-title">Investment Structures We Offer</h2>
    <div class="deal-grid">
      {#each [
        { type: 'Equity', icon: '📈', desc: 'Co-own the development. Share in the upside when the project sells. Higher IRR potential, longer horizon, more exposure.' },
        { type: 'Debt Note', icon: '📄', desc: 'Fixed-rate senior debt secured against the property. Predictable returns, lower risk profile, priority repayment.' },
        { type: 'Rental Income', icon: '🏠', desc: 'Participate in operating cash flows from completed developments. Quarterly distributions, stable yield.' },
        { type: 'Club Deal', icon: '🤝', desc: 'A small-group co-investment structure for larger ticket sizes. Direct access to deal documentation and developer management.' },
      ] as deal}
        <div class="deal-card">
          <span class="deal-card__icon">{deal.icon}</span>
          <h3 class="deal-card__type">{deal.type}</h3>
          <p class="deal-card__desc">{deal.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- FAQ teaser -->
<section class="faq-teaser">
  <div class="container faq-teaser__inner">
    <div>
      <h2 class="section-title" style="margin-bottom:var(--space-2);">Still have questions?</h2>
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);">Read our full FAQ or talk to our investment team directly.</p>
    </div>
    <div class="faq-teaser__links">
      <a href="/faq" class="btn btn--outline">Full FAQ</a>
      <a href="/contact" class="btn btn--primary">Talk to Us</a>
    </div>
  </div>
</section>

<style>
  .container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6); }
  .section-title {
    font-size: var(--text-2xl); font-weight: 700; color: var(--color-text);
    margin-bottom: var(--space-8);
  }

  /* Hero */
  .hiw-hero {
    background: linear-gradient(160deg, #1a1714, #2d2620);
    padding: var(--space-20) 0 var(--space-16);
    color: #fff;
  }
  .hiw-back {
    display: inline-block; font-size: var(--text-sm); color: rgba(255,255,255,0.6);
    text-decoration: none; margin-bottom: var(--space-6);
  }
  .hiw-back:hover { color: #fff; }
  .hiw-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.15em;
    color: var(--color-accent); margin-bottom: var(--space-3);
  }
  .hiw-title {
    font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 300;
    font-family: 'IvyoraDisplay', serif; font-style: italic;
    line-height: 1.2; color: #fff; margin-bottom: var(--space-5);
  }
  .hiw-sub {
    max-width: 600px; font-size: var(--text-base); color: rgba(255,255,255,0.72);
    line-height: 1.7; margin-bottom: var(--space-8);
  }
  .hiw-cta-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }

  /* Steps */
  .hiw-steps { padding: var(--space-16) 0; }
  .steps-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-8);
  }
  .step {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg);
    padding: var(--space-6);
  }
  .step__num {
    font-size: var(--text-3xl); font-weight: 800; color: var(--color-accent);
    opacity: 0.35; font-family: 'IvyoraDisplay', serif;
    margin-bottom: var(--space-3); line-height: 1;
  }
  .step__title {
    font-size: var(--text-base); font-weight: 700; color: var(--color-text);
    margin-bottom: var(--space-3);
  }
  .step__body {
    font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;
    margin-bottom: var(--space-3);
  }
  .step__link {
    font-size: var(--text-xs); font-weight: 700; color: var(--color-accent);
    text-decoration: none;
  }
  .step__link:hover { text-decoration: underline; }

  /* Deal types */
  .deal-types { padding: var(--space-16) 0; background: rgba(0,0,0,0.02); }
  .deal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-5); }
  .deal-card {
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg);
    padding: var(--space-6);
  }
  .deal-card__icon { font-size: 24px; display: block; margin-bottom: var(--space-3); }
  .deal-card__type {
    font-size: var(--text-base); font-weight: 700; color: var(--color-text);
    margin-bottom: var(--space-2);
  }
  .deal-card__desc {
    font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.65;
  }

  /* FAQ teaser */
  .faq-teaser { padding: var(--space-16) 0; }
  .faq-teaser__inner {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--space-8); flex-wrap: wrap;
  }
  .faq-teaser__links { display: flex; gap: var(--space-3); flex-wrap: wrap; }

  @media (max-width: 900px) {
    .steps-grid { grid-template-columns: 1fr 1fr; }
    .deal-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .steps-grid, .deal-grid { grid-template-columns: 1fr; }
  }
</style>
