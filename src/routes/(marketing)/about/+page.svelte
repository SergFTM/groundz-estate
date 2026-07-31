<svelte:head>
  <title>About Us — Groundz</title>
  <meta name="description" content="Groundz is a premium real estate developer in Limassol, Cyprus, offering full-cycle development, investment solutions, and property management." />
</svelte:head>

<!-- ========== HERO ========== -->
<section class="about-hero">
  <div class="container">
    <span class="section-label">ABOUT US</span>
    <h1 class="about-hero__title">Building the Future<br /><em>of Limassol</em></h1>
    <p class="about-hero__sub">
      Groundz is a full-cycle real estate developer based in Limassol, Cyprus. We design, build, and manage premium residential properties — and provide investors with a complete hands-off ownership experience.
    </p>
  </div>
</section>

<!-- ========== MISSION ========== -->
<section class="mission-section">
  <div class="container mission-grid">
    <div class="mission-text">
      <span class="section-label">OUR MISSION</span>
      <h2 class="section-h2">More than a developer.<br />A long-term partner.</h2>
      <p>
        We believe real estate investment should be simple, transparent, and profitable. That's why we handle everything — from site acquisition and architectural design through to construction, furnishing, rental management, and financial reporting.
      </p>
      <p>
        Our team combines deep local expertise in Limassol's property market with modern digital tools, giving investors real-time visibility into their assets and income.
      </p>
      <p>
        Every project we build reflects our commitment to quality: thoughtful architecture, durable materials, and interiors designed for the modern lifestyle — whether you plan to live there or earn from it.
      </p>
    </div>
    <div class="mission-stats">
      <div class="stat-card">
        <span class="stat-card__num">6+</span>
        <span class="stat-card__label">Years in the market</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__num">120+</span>
        <span class="stat-card__label">Units delivered</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__num">98%</span>
        <span class="stat-card__label">Occupancy rate</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__num">40+</span>
        <span class="stat-card__label">Investor partners</span>
      </div>
    </div>
  </div>
</section>

<!-- ========== SERVICES ========== -->
<section class="services-section">
  <div class="container">
    <div class="services-header">
      <span class="section-label">SERVICES</span>
      <h2 class="section-h2">What We Offer</h2>
      <p class="section-sub">A full suite of services to make your investment seamless — from the first brick to the monthly rental income.</p>
    </div>

    <div class="services-grid">
      {#each [
        {
          num: '01',
          title: 'Full-cycle Development',
          desc: 'From site selection and architectural design to construction management, budget control, and project delivery — every stage under one roof. We handle permits, contractors, and quality control so you don\'t have to.',
          icon: '🏗️'
        },
        {
          num: '02',
          title: 'Turnkey Apartment Setup',
          desc: 'Fully furnished, ready-to-move-in homes. Custom furniture, built-in appliances, linens, and every detail thoughtfully prepared. Hand over the keys to your tenant — or move in yourself — on day one.',
          icon: '🛋️'
        },
        {
          num: '03',
          title: 'Property Management',
          desc: 'Tenant search, booking management, payment collection, maintenance coordination, and tax handling — a completely hands-off rental experience for investors. Your income, deposited monthly.',
          icon: '🔑'
        },
        {
          num: '04',
          title: 'Renovation & Interior Design',
          desc: 'Aesthetic and functional interiors tailored to your style and requirements, delivered without managing contractors yourself. We handle budgeting, sourcing, and execution end-to-end.',
          icon: '✏️'
        },
        {
          num: '05',
          title: 'Investment Consulting',
          desc: 'Not sure which unit or strategy fits your goals? Our investment advisors help you evaluate ROI, rental yield, and resale potential — with data-backed projections and local market insight.',
          icon: '📊'
        },
        {
          num: '06',
          title: 'Legal & Documentation Support',
          desc: 'Cyprus property law, title deeds, residency programs — we work alongside trusted local lawyers to make the legal process fast and transparent for international buyers.',
          icon: '📋'
        }
      ] as svc}
        <div class="service-card">
          <div class="service-card__num">{svc.num}</div>
          <h3 class="service-card__title">{svc.title}</h3>
          <p class="service-card__desc">{svc.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ========== WHY LIMASSOL ========== -->
<section class="limassol-section">
  <div class="container limassol-grid">
    <div class="limassol-content">
      <span class="section-label">WHY LIMASSOL</span>
      <h2 class="section-h2">Cyprus's fastest-growing<br />real estate market</h2>
      <p>
        Limassol has established itself as the business and lifestyle capital of Cyprus. A hub for international companies, tech startups, and financial services firms, the city attracts a steady flow of high-income expats and professionals — creating strong, consistent rental demand.
      </p>
      <p>
        With EU membership, favourable tax rates, and a year-round Mediterranean climate, Cyprus remains one of Europe's top destinations for real estate investment. Limassol in particular commands premium rents and strong capital appreciation.
      </p>
      <ul class="limassol-list">
        <li>EU citizenship by investment pathway</li>
        <li>12.5% corporate tax — one of Europe's lowest</li>
        <li>Year-round tourism and expat demand</li>
        <li>Growing tech and fintech hub</li>
        <li>New marina and beachfront developments</li>
      </ul>
    </div>
    <div class="limassol-visual">
      <div class="limassol-map-placeholder">
        <span class="limassol-map-label">Limassol, Cyprus</span>
        <span class="limassol-map-icon">🌊</span>
      </div>
    </div>
  </div>
</section>

<!-- ========== TEAM ========== -->
<section class="team-section">
  <div class="container">
    <div class="team-header">
      <span class="section-label">THE TEAM</span>
      <h2 class="section-h2">People behind Groundz</h2>
      <p class="section-sub">Architects, engineers, investment advisors, and property managers — working together toward one goal.</p>
    </div>
    <div class="team-grid">
      {#each [
        { name: 'Alexander Petrov', role: 'CEO & Co-founder', note: 'Real estate developer with 15 years of experience in Cyprus and Eastern Europe.' },
        { name: 'Marina Kowalski', role: 'Head of Architecture', note: 'Licensed architect specialising in residential design and sustainable construction.' },
        { name: 'Dmitri Volkov', role: 'Investment Director', note: 'Former investment banker. Structures deals and advises investors on portfolio strategy.' },
        { name: 'Elena Christodoulou', role: 'Legal & Compliance', note: 'Cyprus-qualified lawyer with expertise in property law and residency programs.' }
      ] as member}
        <div class="team-card">
          <div class="team-card__avatar">{member.name[0]}</div>
          <div class="team-card__info">
            <span class="team-card__name">{member.name}</span>
            <span class="team-card__role">{member.role}</span>
            <p class="team-card__note">{member.note}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ========== CTA ========== -->
<section class="about-cta">
  <div class="container about-cta__inner">
    <h2 class="about-cta__title">Ready to invest in Limassol?</h2>
    <p class="about-cta__sub">Browse our current projects or speak with an investment advisor today.</p>
    <div class="about-cta__btns">
      <a href="/projects" class="btn btn--primary">View Projects</a>
      <a href="/contact" class="btn btn--outline-dark">Contact Us</a>
    </div>
  </div>
</section>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
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

  .section-h2 {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0 0 var(--space-5);
    line-height: 1.2;
  }

  .section-sub {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    line-height: 1.7;
    max-width: 600px;
    margin: 0 auto;
  }

  /* Hero */
  .about-hero {
    padding: calc(var(--header-height) + var(--space-20)) 0 var(--space-20);
    background: var(--color-bg);
  }

  .about-hero__title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    line-height: 1.1;
    margin: 0 0 var(--space-6);
    max-width: 700px;
  }

  .about-hero__sub {
    font-size: var(--text-lg);
    color: var(--color-text-muted);
    max-width: 620px;
    line-height: 1.7;
    margin: 0;
  }

  /* Mission */
  .mission-section {
    padding: var(--space-20) 0;
    background: var(--color-bg-alt);
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .mission-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-16);
    align-items: start;
  }

  @media (max-width: 900px) {
    .mission-grid { grid-template-columns: 1fr; }
  }

  .mission-text p {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    line-height: 1.7;
    margin: 0 0 var(--space-4);
  }

  .mission-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .stat-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .stat-card__num {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-accent);
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
    line-height: 1;
  }

  .stat-card__label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Services */
  .services-section {
    padding: var(--space-20) 0;
  }

  .services-header {
    text-align: center;
    margin-bottom: var(--space-12);
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
  }

  @media (max-width: 900px) {
    .services-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 600px) {
    .services-grid { grid-template-columns: 1fr; }
  }

  .service-card {
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .service-card__num {
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--color-accent);
  }

  .service-card__title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .service-card__desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.65;
    margin: 0;
  }

  /* Why Limassol */
  .limassol-section {
    padding: var(--space-20) 0;
    background: var(--color-bg-alt);
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .limassol-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: var(--space-16);
    align-items: center;
  }

  @media (max-width: 900px) {
    .limassol-grid { grid-template-columns: 1fr; }
  }

  .limassol-content p {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    line-height: 1.7;
    margin: 0 0 var(--space-4);
  }

  .limassol-list {
    list-style: none;
    padding: 0;
    margin: var(--space-6) 0 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .limassol-list li {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text);
    padding-left: var(--space-5);
    position: relative;
  }

  .limassol-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-accent);
    font-weight: 700;
  }

  .limassol-visual {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .limassol-map-placeholder {
    width: 100%;
    aspect-ratio: 4/3;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  .limassol-map-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .limassol-map-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* Team */
  .team-section {
    padding: var(--space-20) 0;
  }

  .team-header {
    text-align: center;
    margin-bottom: var(--space-12);
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-5);
  }

  @media (max-width: 1000px) {
    .team-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 600px) {
    .team-grid { grid-template-columns: 1fr; }
  }

  .team-card {
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .team-card__avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xl);
    font-weight: 700;
    font-family: 'IvyoraDisplay', serif;
    font-style: italic;
    flex-shrink: 0;
  }

  .team-card__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .team-card__name {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .team-card__role {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .team-card__note {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.55;
    margin: var(--space-2) 0 0;
  }

  /* CTA */
  .about-cta {
    padding: var(--space-20) 0;
    background: var(--color-bg-alt);
    border-top: 1px solid var(--color-border);
  }

  .about-cta__inner {
    text-align: center;
  }

  .about-cta__title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0 0 var(--space-4);
  }

  .about-cta__sub {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-8);
  }

  .about-cta__btns {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn--outline-dark {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-7);
    border: 1.5px solid var(--color-text);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
    transition: all var(--transition-base);
    background: transparent;
  }

  .btn--outline-dark:hover {
    background: var(--color-text);
    color: #fff;
  }
</style>
