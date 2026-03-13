<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  // Multi-select for deal types (checkboxes → joined string)
  let dealTypes = $state<string[]>([]);
  const DEAL_OPTIONS = [
    { value: 'equity',    label: 'Equity' },
    { value: 'debt_note', label: 'Debt Note' },
    { value: 'rental',    label: 'Rental Income' },
    { value: 'club_deal', label: 'Club Deal' },
  ];

  function toggleDeal(v: string) {
    dealTypes = dealTypes.includes(v)
      ? dealTypes.filter(d => d !== v)
      : [...dealTypes, v];
  }

  let submitted = $state(false);
</script>

<svelte:head>
  <title>Apply as Investor — Develta</title>
  <meta name="description" content="Apply to invest in Develta's Cyprus real estate pools. Submit your investor profile and our team will contact you within 24 hours." />
</svelte:head>

<!-- Hero -->
<section class="apply-hero">
  <div class="container">
    <a href="/investment" class="apply-back">← Investment Pools</a>
    <p class="apply-label">INVESTOR APPLICATION</p>
    <h1 class="apply-title">Start Your Investment<br/>Journey with Develta</h1>
    <p class="apply-sub">Tell us about yourself and your investment goals. Our team will review your application and reach out within 1 business day to discuss current pool opportunities.</p>
  </div>
</section>

<!-- Form + sidebar -->
<section class="apply-body">
  <div class="container apply-body__grid">

    <!-- Form -->
    <div class="apply-form-col">

      {#if form?.success || submitted}
        <div class="apply-success">
          <div class="apply-success__icon">✓</div>
          <h2 class="apply-success__title">Application Received</h2>
          <p class="apply-success__body">Thank you for your interest. Our investment team will contact you at the email provided within 1 business day to discuss your profile and current pool opportunities.</p>
          <a href="/investment" class="btn btn--primary" style="margin-top:var(--space-6);">Browse Pools →</a>
        </div>

      {:else}
        <form
          method="POST"
          use:enhance={() => async ({ update }) => {
            await update();
            if (!form?.error) submitted = true;
          }}
        >
          <!-- Hidden field for multi-select deal types -->
          <input type="hidden" name="dealTypeInterest" value={dealTypes.join(',')} />

          {#if form?.error}
            <div class="form-error-banner">{form.error}</div>
          {/if}

          <!-- Section: Personal -->
          <div class="form-section">
            <p class="form-section__label">Personal Details</p>
            <div class="form-row-2">
              <div>
                <label class="form-label" for="name">Full Name *</label>
                <input class="form-input" id="name" name="name" type="text" placeholder="John Smith" required />
              </div>
              <div>
                <label class="form-label" for="nationality">Nationality *</label>
                <input class="form-input" id="nationality" name="nationality" type="text" placeholder="e.g. British, Russian, Israeli" required />
              </div>
            </div>
            <div class="form-row-2">
              <div>
                <label class="form-label" for="email">Email *</label>
                <input class="form-input" id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label class="form-label" for="phone">Phone *</label>
                <input class="form-input" id="phone" name="phone" type="tel" placeholder="+357 99 000 000" required />
              </div>
            </div>
          </div>

          <!-- Section: Investor Profile -->
          <div class="form-section">
            <p class="form-section__label">Investor Profile</p>

            <div class="form-row-2">
              <div>
                <label class="form-label" for="investorType">Investor Type *</label>
                <select class="form-input" id="investorType" name="investorType" required>
                  <option value="">Select…</option>
                  <option value="individual">Individual</option>
                  <option value="company">Corporate / LLC</option>
                  <option value="family_office">Family Office</option>
                </select>
              </div>
              <div>
                <label class="form-label" for="ticketSize">Expected Ticket Size *</label>
                <select class="form-input" id="ticketSize" name="ticketSize" required>
                  <option value="">Select…</option>
                  <option value="25k_100k">€25k – €100k</option>
                  <option value="100k_500k">€100k – €500k</option>
                  <option value="500k_plus">€500k+</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">Deal Types of Interest *</label>
              <div class="deal-checkboxes">
                {#each DEAL_OPTIONS as opt}
                  <button
                    type="button"
                    class="deal-chip"
                    class:deal-chip--active={dealTypes.includes(opt.value)}
                    onclick={() => toggleDeal(opt.value)}
                  >{opt.label}</button>
                {/each}
              </div>
              {#if dealTypes.length === 0}
                <p class="field-hint">Select one or more deal types</p>
              {/if}
            </div>

            <div>
              <label class="form-label" for="timeHorizon">Investment Time Horizon *</label>
              <select class="form-input" id="timeHorizon" name="timeHorizon" style="max-width:300px;" required>
                <option value="">Select…</option>
                <option value="short">Short (12–18 months)</option>
                <option value="medium">Medium (18–36 months)</option>
                <option value="long">Long (36+ months)</option>
              </select>
            </div>
          </div>

          <!-- Section: Message -->
          <div class="form-section">
            <p class="form-section__label">Additional Information</p>
            <div>
              <label class="form-label" for="message">Message / Questions (optional)</label>
              <textarea
                class="form-input"
                id="message"
                name="message"
                rows="4"
                placeholder="Anything you'd like us to know — specific pools you're interested in, questions about structure, timeline, etc."
                style="resize:vertical;"
              ></textarea>
            </div>
          </div>

          <!-- Confirmations -->
          <div class="form-section">
            <label class="form-check">
              <input type="checkbox" name="accreditedConfirm" required />
              <span>I confirm I am a qualified / accredited investor and understand that private real estate investments carry risk including potential loss of capital.</span>
            </label>
            <label class="form-check" style="margin-top:var(--space-3);">
              <input type="checkbox" name="gdprConsent" required />
              <span>I agree to Develta's <a href="/privacy" class="check-link">Privacy Policy</a> and consent to being contacted about investment opportunities.</span>
            </label>
          </div>

          <button type="submit" class="btn btn--primary apply-submit">Submit Application →</button>
        </form>
      {/if}
    </div>

    <!-- Sidebar -->
    <aside class="apply-sidebar">
      <div class="sidebar-card">
        <p class="sidebar-card__label">WHAT HAPPENS NEXT</p>
        <ol class="sidebar-steps">
          <li><strong>Review (24h)</strong> — Our team reviews your profile and checks current pool availability.</li>
          <li><strong>Intro Call</strong> — We schedule a 30-minute call to walk through your goals and present matching pools.</li>
          <li><strong>Data Room Access</strong> — You receive full deal documentation for pools that match your criteria.</li>
          <li><strong>Soft Commit</strong> — Reserve your allocation with no funds transferred yet.</li>
          <li><strong>KYC & Signing</strong> — Complete verification and sign subscription documents via the investor portal.</li>
        </ol>
      </div>

      <div class="sidebar-card sidebar-card--accent">
        <p class="sidebar-card__label">MINIMUM TICKET</p>
        <p class="sidebar-card__big">€25,000</p>
        <p class="sidebar-card__sub">Most pools start from €25k. Club deals from €250k. There is no upper limit.</p>
      </div>

      <div class="sidebar-card">
        <p class="sidebar-card__label">USEFUL LINKS</p>
        <div class="sidebar-links">
          <a href="/invest/how-it-works">How It Works →</a>
          <a href="/invest/protections">Investor Protections →</a>
          <a href="/investment">Browse Pools →</a>
          <a href="/faq">Investor FAQ →</a>
        </div>
      </div>
    </aside>

  </div>
</section>

<style>
  .container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6); }

  /* Hero */
  .apply-hero {
    background: linear-gradient(160deg, #1a1714, #2d2620);
    padding: var(--space-20) 0 var(--space-16);
    color: #fff;
  }
  .apply-back {
    display: inline-block; font-size: var(--text-sm); color: rgba(255,255,255,0.6);
    text-decoration: none; margin-bottom: var(--space-6);
  }
  .apply-back:hover { color: #fff; }
  .apply-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.15em;
    color: var(--color-accent); margin-bottom: var(--space-3);
  }
  .apply-title {
    font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 300;
    font-family: 'IvyoraDisplay', serif; font-style: italic;
    line-height: 1.2; color: #fff; margin-bottom: var(--space-5);
  }
  .apply-sub {
    max-width: 560px; font-size: var(--text-base); color: rgba(255,255,255,0.72);
    line-height: 1.7;
  }

  /* Body layout */
  .apply-body { padding: var(--space-16) 0; }
  .apply-body__grid {
    display: grid; grid-template-columns: 1fr 340px; gap: var(--space-10); align-items: start;
  }

  /* Form */
  .form-section { margin-bottom: var(--space-8); }
  .form-section__label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--color-text-muted); margin-bottom: var(--space-4);
  }
  .form-row-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);
  }
  .form-error-banner {
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    border-radius: var(--radius-md); padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-5); font-size: var(--text-sm); color: #ef4444;
  }

  /* Deal chips */
  .deal-checkboxes {
    display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-2);
  }
  .deal-chip {
    font-size: var(--text-xs); font-weight: 700; padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md); border: 1px solid rgba(0,0,0,0.15);
    background: transparent; color: var(--color-text-muted); cursor: pointer;
    transition: all 0.15s;
  }
  .deal-chip--active {
    border-color: var(--color-accent); background: var(--color-accent); color: #fff;
  }
  .field-hint { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-1); }

  /* Checkboxes */
  .form-check {
    display: flex; align-items: flex-start; gap: var(--space-3); cursor: pointer;
    font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6;
  }
  .form-check input[type="checkbox"] { margin-top: 3px; flex-shrink: 0; accent-color: var(--color-accent); }
  .check-link { color: var(--color-accent); }

  .apply-submit { width: 100%; margin-top: var(--space-4); }

  /* Success */
  .apply-success {
    background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg);
    padding: var(--space-10); text-align: center;
  }
  .apply-success__icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(34,197,94,0.12); color: #22c55e;
    font-size: 24px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto var(--space-5);
  }
  .apply-success__title {
    font-size: var(--text-xl); font-weight: 700; color: var(--color-text);
    margin-bottom: var(--space-3);
  }
  .apply-success__body {
    font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.7;
    max-width: 420px; margin: 0 auto;
  }

  /* Sidebar */
  .apply-sidebar { display: flex; flex-direction: column; gap: var(--space-5); }
  .sidebar-card {
    background: rgba(255,255,255,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-lg); padding: var(--space-6);
  }
  .sidebar-card--accent {
    background: linear-gradient(135deg, rgba(180,140,80,0.08), rgba(180,140,80,0.02));
    border-color: rgba(180,140,80,0.2);
  }
  .sidebar-card__label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--color-text-muted); margin-bottom: var(--space-4);
  }
  .sidebar-card__big {
    font-size: var(--text-3xl); font-weight: 800; color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif; margin-bottom: var(--space-2);
  }
  .sidebar-card__sub { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6; }

  .sidebar-steps {
    margin: 0; padding-left: var(--space-5);
    display: flex; flex-direction: column; gap: var(--space-3);
  }
  .sidebar-steps li { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6; }
  .sidebar-steps li strong { color: var(--color-text); }

  .sidebar-links { display: flex; flex-direction: column; gap: var(--space-2); }
  .sidebar-links a {
    font-size: var(--text-sm); font-weight: 600; color: var(--color-accent);
    text-decoration: none;
  }
  .sidebar-links a:hover { text-decoration: underline; }

  @media (max-width: 900px) {
    .apply-body__grid { grid-template-columns: 1fr; }
    .apply-sidebar { order: -1; }
  }
  @media (max-width: 600px) {
    .form-row-2 { grid-template-columns: 1fr; }
  }
</style>
