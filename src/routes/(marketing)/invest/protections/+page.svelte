<svelte:head>
  <title>Investor Protections — Groundz</title>
  <meta name="description" content="How Groundz protects your capital: SPV isolation, registered security, escrow controls, KYC compliance, and independent audits." />
</svelte:head>

<!-- Hero -->
<section class="prot-hero">
  <div class="container">
    <a href="/pools" class="prot-back">← Investment Pools</a>
    <p class="prot-label">INVESTOR PROTECTIONS</p>
    <h1 class="prot-title">Your Capital is<br/>Structurally Protected</h1>
    <p class="prot-sub">Groundz uses legally isolated Special Purpose Vehicles, registered collateral, escrow-controlled disbursements, and independent oversight — so your investment is protected by structure, not just promises.</p>
    <div class="prot-cta-row">
      <a href="/invest/apply" class="btn btn--primary">Apply as Investor →</a>
      <a href="/invest/how-it-works" class="btn btn--outline">How It Works</a>
    </div>
  </div>
</section>

<!-- Core protections grid -->
<section class="prot-core">
  <div class="container">
    <h2 class="section-title">Core Legal & Financial Protections</h2>
    <div class="prot-grid">

      <div class="prot-card prot-card--featured">
        <div class="prot-card__icon">🏛</div>
        <h3 class="prot-card__title">SPV Isolation</h3>
        <p class="prot-card__body">Every investment pool is housed in a separate Special Purpose Vehicle (SPV) registered in Cyprus. Your capital is legally ringfenced — problems in one project cannot affect another, and Groundz's corporate liabilities cannot touch pool assets.</p>
        <ul class="prot-list">
          <li>Separate legal entity per pool</li>
          <li>Cyprus company registration</li>
          <li>No cross-pool contamination</li>
          <li>Bankruptcy-remote structure</li>
        </ul>
      </div>

      <div class="prot-card">
        <div class="prot-card__icon">📋</div>
        <h3 class="prot-card__title">Registered Security Interest</h3>
        <p class="prot-card__body">Debt note and senior debt instruments include a registered charge over the underlying property or development asset. In the event of default, secured creditors have priority claim on the asset before unsecured parties.</p>
        <ul class="prot-list">
          <li>Charge registered with Land Registry</li>
          <li>Priority repayment on exit</li>
          <li>Asset value ≥ loan amount (LTV covenant)</li>
        </ul>
      </div>

      <div class="prot-card">
        <div class="prot-card__icon">🔐</div>
        <h3 class="prot-card__title">Escrow-Controlled Disbursements</h3>
        <p class="prot-card__body">Funds raised into the SPV are held in a dedicated escrow account and released to the developer only upon hitting verified construction milestones. No milestone achieved — no funds released.</p>
        <ul class="prot-list">
          <li>Milestone-gated fund release</li>
          <li>Third-party escrow agent</li>
          <li>Digital evidence trail per disbursement</li>
        </ul>
      </div>

      <div class="prot-card">
        <div class="prot-card__icon">📊</div>
        <h3 class="prot-card__title">Developer Co-Investment</h3>
        <p class="prot-card__body">Groundz requires developers to co-invest their own capital in every pool. This aligns developer incentives with investor outcomes — they lose money first if the project underperforms.</p>
        <ul class="prot-list">
          <li>Minimum 10–20% developer co-invest</li>
          <li>Disclosed in every pool data room</li>
          <li>Verified before raise opens</li>
        </ul>
      </div>

      <div class="prot-card">
        <div class="prot-card__icon">🔍</div>
        <h3 class="prot-card__title">Independent Audit & Reporting</h3>
        <p class="prot-card__body">SPV accounts are audited annually by an independent Cyprus-registered auditor. Construction progress is verified by a third-party quantity surveyor before each escrow release. Reports are available to all pool investors.</p>
        <ul class="prot-list">
          <li>Annual SPV audit</li>
          <li>QS sign-off per escrow draw</li>
          <li>Audit reports in investor data room</li>
        </ul>
      </div>

      <div class="prot-card">
        <div class="prot-card__icon">✅</div>
        <h3 class="prot-card__title">KYC & AML Compliance</h3>
        <p class="prot-card__body">All investors undergo Know Your Customer and Anti-Money Laundering screening before committing. This protects the pool from illicit funds and ensures regulatory compliance across all EU and FATF jurisdictions.</p>
        <ul class="prot-list">
          <li>Identity & address verification</li>
          <li>Proof of funds check</li>
          <li>EU AML directive compliance</li>
        </ul>
      </div>

    </div>
  </div>
</section>

<!-- Deal structure comparison -->
<section class="prot-structures">
  <div class="container">
    <h2 class="section-title">Protection Level by Deal Type</h2>
    <div class="struct-table-wrap">
      <table class="struct-table">
        <thead>
          <tr>
            <th>Protection</th>
            <th>Equity</th>
            <th>Debt Note</th>
            <th>Rental Income</th>
            <th>Club Deal</th>
          </tr>
        </thead>
        <tbody>
          {#each [
            ['SPV Isolation',            true,  true,  true,  true ],
            ['Registered Security',      false, true,  false, true ],
            ['Escrow Disbursements',     true,  true,  false, true ],
            ['Developer Co-invest',      true,  true,  true,  true ],
            ['Priority Repayment',       false, true,  false, false],
            ['Independent Audit',        true,  true,  true,  true ],
          ] as [label, eq, dn, ri, cd]}
            <tr>
              <td class="struct-label">{label}</td>
              <td class:yes={eq}  class:no={!eq} >{eq  ? '✓' : '—'}</td>
              <td class:yes={dn}  class:no={!dn} >{dn  ? '✓' : '—'}</td>
              <td class:yes={ri}  class:no={!ri} >{ri  ? '✓' : '—'}</td>
              <td class:yes={cd}  class:no={!cd} >{cd  ? '✓' : '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="struct-note">Debt Note investors have the highest structural protection: registered security + priority repayment. Equity investors accept higher risk in exchange for higher IRR potential.</p>
  </div>
</section>

<!-- Risk disclaimer -->
<section class="prot-risk">
  <div class="container">
    <div class="risk-box">
      <p class="risk-box__label">IMPORTANT NOTICE</p>
      <p class="risk-box__text">All investments carry risk. Past performance is not indicative of future results. The value of your investment may go down as well as up. Capital invested in real estate development pools is illiquid for the agreed investment term and cannot be redeemed early. Please read the full Information Memorandum for each pool before committing capital. Groundz's investment products are intended for experienced investors who understand and can bear the risks of private real estate investment.</p>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="prot-cta">
  <div class="container prot-cta__inner">
    <div>
      <h2 class="section-title" style="margin-bottom:var(--space-2);">Ready to invest with confidence?</h2>
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);">Apply as a qualified investor and get access to current pool data rooms.</p>
    </div>
    <div class="prot-cta__links">
      <a href="/invest/apply" class="btn btn--primary">Apply as Investor →</a>
      <a href="/pools" class="btn btn--outline">Browse Pools</a>
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
  .prot-hero {
    background: linear-gradient(160deg, #1a1714, #2d2620);
    padding: var(--space-20) 0 var(--space-16);
    color: #fff;
  }
  .prot-back {
    display: inline-block; font-size: var(--text-sm); color: rgba(255,255,255,0.6);
    text-decoration: none; margin-bottom: var(--space-6);
  }
  .prot-back:hover { color: #fff; }
  .prot-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.15em;
    color: var(--color-accent); margin-bottom: var(--space-3);
  }
  .prot-title {
    font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 300;
    font-family: 'IvyoraDisplay', serif; font-style: italic;
    line-height: 1.2; color: #fff; margin-bottom: var(--space-5);
  }
  .prot-sub {
    max-width: 600px; font-size: var(--text-base); color: rgba(255,255,255,0.72);
    line-height: 1.7; margin-bottom: var(--space-8);
  }
  .prot-cta-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }

  /* Core grid */
  .prot-core { padding: var(--space-16) 0; }
  .prot-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6);
  }
  .prot-card {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg);
    padding: var(--space-6);
  }
  .prot-card--featured {
    border-color: rgba(var(--color-accent-rgb, 180,140,80), 0.3);
    background: rgba(255,255,255,0.7);
  }
  .prot-card__icon { font-size: 28px; margin-bottom: var(--space-3); }
  .prot-card__title {
    font-size: var(--text-base); font-weight: 700; color: var(--color-text);
    margin-bottom: var(--space-3);
  }
  .prot-card__body {
    font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;
    margin-bottom: var(--space-4);
  }
  .prot-list {
    margin: 0; padding: 0; list-style: none;
    display: flex; flex-direction: column; gap: var(--space-1);
  }
  .prot-list li {
    font-size: var(--text-xs); color: var(--color-text-muted);
    padding-left: var(--space-4); position: relative;
  }
  .prot-list li::before {
    content: '✓'; position: absolute; left: 0;
    color: var(--color-accent); font-weight: 700;
  }

  /* Deal structures */
  .prot-structures { padding: var(--space-16) 0; background: rgba(0,0,0,0.02); }
  .struct-table-wrap { overflow-x: auto; margin-bottom: var(--space-5); }
  .struct-table {
    width: 100%; border-collapse: collapse;
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg);
    overflow: hidden; min-width: 560px;
  }
  .struct-table th {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--color-text-muted);
    text-align: center; border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  .struct-table th:first-child { text-align: left; }
  .struct-table td {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm); text-align: center;
    border-bottom: 1px solid rgba(0,0,0,0.04);
  }
  .struct-label { text-align: left !important; font-weight: 600; color: var(--color-text); }
  .struct-table td.yes { color: #22c55e; font-weight: 700; }
  .struct-table td.no  { color: var(--color-text-muted); }
  .struct-note {
    font-size: var(--text-sm); color: var(--color-text-muted);
    line-height: 1.7; max-width: 700px;
  }

  /* Risk disclaimer */
  .prot-risk { padding: var(--space-12) 0; }
  .risk-box {
    background: rgba(239,68,68,0.04);
    border: 1px solid rgba(239,68,68,0.15);
    border-radius: var(--radius-lg); padding: var(--space-6);
  }
  .risk-box__label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    color: #ef4444; margin-bottom: var(--space-3);
  }
  .risk-box__text {
    font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.8;
  }

  /* CTA */
  .prot-cta { padding: var(--space-16) 0; }
  .prot-cta__inner {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--space-8); flex-wrap: wrap;
  }
  .prot-cta__links { display: flex; gap: var(--space-3); flex-wrap: wrap; }

  @media (max-width: 900px) {
    .prot-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .prot-grid { grid-template-columns: 1fr; }
  }
</style>
