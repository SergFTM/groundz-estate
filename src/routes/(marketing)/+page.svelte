<script lang="ts">
	import { reveal } from '$lib/utils/scroll-reveal';
	import KPICard from '$lib/components/KPICard.svelte';
	import ROICalculator from '$lib/components/ROICalculator.svelte';
	import ProjectCarousel from '$lib/components/ProjectCarousel.svelte';
	import LeadQuizWidget from '$lib/components/LeadQuizWidget.svelte';

	let { data } = $props();

	let scrollY = $state(0);
	// Text fades out + moves up fast, skyline moves up slower = parallax difference
	let heroOpacity = $derived(Math.max(0, 1 - scrollY / 700));
	let heroTextShift = $derived(scrollY * 0.4);
	let heroBuildingsShift = $derived(scrollY * 0.12);
</script>

<svelte:window bind:scrollY={scrollY} />

<svelte:head>
	<title>Groundz — Premium Real Estate in Limassol, Cyprus</title>
	<meta name="description" content="Digital platform for smart real estate investment in Limassol, Cyprus. Transparent process from first interest to ownership." />
	<meta property="og:title" content="Groundz — Premium Real Estate in Limassol, Cyprus" />
	<meta property="og:description" content="Digital platform for smart real estate investment in Limassol, Cyprus." />
	<meta property="og:type" content="website" />
	<meta name="robots" content="index, follow" />
</svelte:head>

<!-- ========== HERO — Gradient + Parallax Skyline ========== -->
<section class="hero">

	<!-- Layer 1: Construction skyline SVG (parallax — bold visibility) -->
	<div class="hero__skyline" style="transform: translateY({heroBuildingsShift}px)">
		<svg class="hero__skyline-svg" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="xMidYMax slice">
			<!-- Tower crane left -->
			<line x1="140" y1="40" x2="140" y2="520" stroke="rgba(90,100,80,0.18)" stroke-width="2.5"/>
			<line x1="80" y1="65" x2="280" y2="65" stroke="rgba(90,100,80,0.18)" stroke-width="2.5"/>
			<line x1="140" y1="65" x2="95" y2="520" stroke="rgba(90,100,80,0.08)" stroke-width="1.5"/>
			<line x1="280" y1="65" x2="265" y2="160" stroke="rgba(90,100,80,0.12)" stroke-width="1" stroke-dasharray="6 4"/>
			<line x1="265" y1="160" x2="265" y2="220" stroke="rgba(90,100,80,0.10)" stroke-width="1"/>
			<rect x="256" y="220" width="18" height="10" fill="rgba(90,100,80,0.08)" rx="1"/>

			<!-- Building 1 — tall glass tower -->
			<rect x="260" y="100" width="120" height="500" fill="rgba(90,100,80,0.07)" rx="2"/>
			<line x1="260" y1="150" x2="380" y2="150" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="200" x2="380" y2="200" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="250" x2="380" y2="250" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="300" x2="380" y2="300" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="350" x2="380" y2="350" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="400" x2="380" y2="400" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="450" x2="380" y2="450" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="260" y1="500" x2="380" y2="500" stroke="rgba(90,100,80,0.06)" stroke-width="1"/>
			<line x1="320" y1="100" x2="320" y2="600" stroke="rgba(90,100,80,0.03)" stroke-width="1"/>
			<!-- Windows -->
			<rect x="275" y="115" width="16" height="22" fill="rgba(90,100,80,0.06)" rx="1"/>
			<rect x="303" y="115" width="16" height="22" fill="rgba(90,100,80,0.09)" rx="1"/>
			<rect x="348" y="115" width="16" height="22" fill="rgba(90,100,80,0.06)" rx="1"/>
			<rect x="275" y="165" width="16" height="22" fill="rgba(90,100,80,0.07)" rx="1"/>
			<rect x="303" y="165" width="16" height="22" fill="rgba(90,100,80,0.06)" rx="1"/>
			<rect x="348" y="165" width="16" height="22" fill="rgba(90,100,80,0.09)" rx="1"/>
			<rect x="275" y="215" width="16" height="22" fill="rgba(90,100,80,0.06)" rx="1"/>
			<rect x="348" y="215" width="16" height="22" fill="rgba(90,100,80,0.07)" rx="1"/>
			<rect x="275" y="265" width="16" height="22" fill="rgba(90,100,80,0.09)" rx="1"/>
			<rect x="303" y="265" width="16" height="22" fill="rgba(90,100,80,0.06)" rx="1"/>
			<rect x="348" y="265" width="16" height="22" fill="rgba(90,100,80,0.07)" rx="1"/>

			<!-- Building 2 — wide mid-rise -->
			<rect x="410" y="260" width="160" height="340" fill="rgba(90,100,80,0.06)" rx="2"/>
			<line x1="410" y1="310" x2="570" y2="310" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="410" y1="360" x2="570" y2="360" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="410" y1="410" x2="570" y2="410" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="410" y1="460" x2="570" y2="460" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="490" y1="260" x2="490" y2="600" stroke="rgba(90,100,80,0.03)" stroke-width="1"/>
			<rect x="425" y="275" width="14" height="20" fill="rgba(90,100,80,0.07)" rx="1"/>
			<rect x="450" y="275" width="14" height="20" fill="rgba(90,100,80,0.05)" rx="1"/>
			<rect x="505" y="275" width="14" height="20" fill="rgba(90,100,80,0.07)" rx="1"/>
			<rect x="540" y="275" width="14" height="20" fill="rgba(90,100,80,0.05)" rx="1"/>

			<!-- Tower crane right -->
			<line x1="1100" y1="20" x2="1100" y2="520" stroke="rgba(90,100,80,0.16)" stroke-width="2.5"/>
			<line x1="980" y1="45" x2="1240" y2="45" stroke="rgba(90,100,80,0.16)" stroke-width="2.5"/>
			<line x1="1100" y1="45" x2="1040" y2="520" stroke="rgba(90,100,80,0.06)" stroke-width="1.5"/>
			<line x1="1240" y1="45" x2="1225" y2="140" stroke="rgba(90,100,80,0.10)" stroke-width="1" stroke-dasharray="6 4"/>
			<line x1="1225" y1="140" x2="1225" y2="200" stroke="rgba(90,100,80,0.10)" stroke-width="1"/>
			<rect x="1216" y="200" width="18" height="10" fill="rgba(90,100,80,0.07)" rx="1"/>

			<!-- Building 3 — right tower under construction -->
			<rect x="930" y="140" width="110" height="460" fill="rgba(90,100,80,0.065)" rx="1"/>
			<line x1="930" y1="190" x2="1040" y2="190" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="930" y1="240" x2="1040" y2="240" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="930" y1="290" x2="1040" y2="290" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="930" y1="340" x2="1040" y2="340" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="930" y1="390" x2="1040" y2="390" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="930" y1="440" x2="1040" y2="440" stroke="rgba(90,100,80,0.05)" stroke-width="1"/>
			<line x1="985" y1="140" x2="985" y2="600" stroke="rgba(90,100,80,0.03)" stroke-width="1"/>
			<!-- Scaffolding -->
			<rect x="930" y="140" width="110" height="100" fill="rgba(90,100,80,0.03)"/>
			<line x1="930" y1="140" x2="1040" y2="240" stroke="rgba(90,100,80,0.05)" stroke-width="0.7"/>
			<line x1="1040" y1="140" x2="930" y2="240" stroke="rgba(90,100,80,0.05)" stroke-width="0.7"/>

			<!-- Building 4 — far right -->
			<rect x="1240" y="300" width="80" height="300" fill="rgba(90,100,80,0.05)" rx="1"/>
			<line x1="1240" y1="350" x2="1320" y2="350" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>
			<line x1="1240" y1="400" x2="1320" y2="400" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>
			<line x1="1240" y1="450" x2="1320" y2="450" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>

			<!-- Small building far left -->
			<rect x="30" y="340" width="90" height="260" fill="rgba(90,100,80,0.05)" rx="1"/>
			<line x1="30" y1="390" x2="120" y2="390" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>
			<line x1="30" y1="440" x2="120" y2="440" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>
			<line x1="30" y1="490" x2="120" y2="490" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>

			<!-- Villa mid-right -->
			<path d="M720 480 L720 380 L785 330 L850 380 L850 480" stroke="rgba(90,100,80,0.10)" stroke-width="1.5" fill="rgba(90,100,80,0.035)"/>
			<rect x="748" y="420" width="30" height="60" fill="rgba(90,100,80,0.05)" rx="1"/>
			<rect x="800" y="395" width="22" height="28" fill="rgba(90,100,80,0.06)" rx="1"/>

			<!-- Residential blocks -->
			<rect x="600" y="400" width="60" height="200" fill="rgba(90,100,80,0.05)" rx="1"/>
			<rect x="670" y="430" width="50" height="170" fill="rgba(90,100,80,0.04)" rx="1"/>
			<line x1="600" y1="450" x2="660" y2="450" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>
			<line x1="600" y1="500" x2="660" y2="500" stroke="rgba(90,100,80,0.04)" stroke-width="1"/>

			<!-- Ground line -->
			<line x1="0" y1="600" x2="1440" y2="600" stroke="rgba(90,100,80,0.10)" stroke-width="1.5"/>
		</svg>
	</div>

	<!-- Layer 2: text content (fastest parallax — moves up most) -->
	<div class="hero__content container" style="opacity: {heroOpacity}; transform: translateY({heroTextShift}px)">
		<span class="hero__tag">Premium Real Estate — Limassol, Cyprus</span>

		<h1 class="hero__heading">
			Transparency in every<br/>brick we lay.
		</h1>

		<p class="hero__subtitle">
			A digital platform for mindful real estate investment.<br/>
			From first inquiry to key handover — we guide every step.
		</p>

		<div class="hero__cta">
			<a href="/projects" class="btn btn--primary btn--lg">View Projects</a>
			<a href="#roi-calculator" class="btn btn--hero-outline btn--lg">Calculate ROI</a>
		</div>
	</div>

	<!-- Stats bar at bottom -->
	<div class="hero__bottom">
		<div class="hero__bottom-inner container">
			<div class="hero__stat">
				<span class="hero__stat-num">7%</span>
				<span class="hero__stat-label">Avg. Annual Yield</span>
			</div>
			<div class="hero__stat-divider"></div>
			<div class="hero__stat">
				<span class="hero__stat-num">15+</span>
				<span class="hero__stat-label">Completed Projects</span>
			</div>
			<div class="hero__stat-divider"></div>
			<div class="hero__stat">
				<span class="hero__stat-num">300+</span>
				<span class="hero__stat-label">Clients Served</span>
			</div>
			<div class="hero__stat-divider"></div>
			<div class="hero__stat">
				<span class="hero__stat-num">€300k</span>
				<span class="hero__stat-label">PR Investment Threshold</span>
			</div>
		</div>
	</div>
</section>

<!-- ========== FEATURED PROJECTS ========== -->
<section class="section projects-section">
	<div class="projects-section__bg-element" style="transform: translateY({scrollY * 0.06}px)">
		<svg viewBox="0 0 300 400" fill="none" width="300" height="400">
			<rect x="130" y="0" width="40" height="400" fill="rgba(122,140,110,0.03)"/>
			<rect x="120" y="0" width="60" height="20" fill="rgba(122,140,110,0.04)" rx="2"/>
			<rect x="120" y="380" width="60" height="20" fill="rgba(122,140,110,0.04)" rx="2"/>
			<line x1="150" y1="20" x2="150" y2="380" stroke="rgba(122,140,110,0.03)" stroke-width="0.5" stroke-dasharray="8 4"/>
		</svg>
	</div>
	<div class="container" style="position:relative; z-index:1" use:reveal>
		<div class="projects-header">
			<span class="overline">Portfolio</span>
			<h2>Our Projects</h2>
		</div>
		<ProjectCarousel projects={data.projects} />
	</div>
</section>

<!-- ========== PROPERTY SELECTION ========== -->
<section class="section cta-section">
	<div class="cta-section__skyline">
		<svg viewBox="0 0 1440 200" fill="none" preserveAspectRatio="xMidYMax slice">
			<rect x="100" y="80" width="60" height="120" fill="rgba(255,255,255,0.02)" rx="1"/>
			<rect x="180" y="40" width="80" height="160" fill="rgba(255,255,255,0.025)" rx="1"/>
			<rect x="280" y="100" width="50" height="100" fill="rgba(255,255,255,0.015)" rx="1"/>
			<path d="M400 120 L400 80 L440 50 L480 80 L480 120" stroke="rgba(255,255,255,0.03)" stroke-width="1" fill="rgba(255,255,255,0.01)"/>
			<rect x="900" y="60" width="70" height="140" fill="rgba(255,255,255,0.02)" rx="1"/>
			<rect x="990" y="90" width="90" height="110" fill="rgba(255,255,255,0.025)" rx="1"/>
			<rect x="1100" y="40" width="60" height="160" fill="rgba(255,255,255,0.02)" rx="1"/>
			<rect x="1200" y="100" width="80" height="100" fill="rgba(255,255,255,0.015)" rx="1"/>
			<line x1="0" y1="200" x2="1440" y2="200" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
		</svg>
	</div>
	<div class="container" style="position:relative; z-index:1" use:reveal>
		<div class="cta-layout">
			<div class="cta-text">
				<span class="overline overline--light">Personal Advisory</span>
				<h2 class="cta-title">Find Your Ideal Property</h2>
				<p class="cta-subtitle">
					Answer a few questions and get a personalised selection of properties that match your goals.
				</p>
			</div>
			<div class="cta-widget">
				<LeadQuizWidget />
			</div>
		</div>
	</div>
</section>

<!-- ========== ROI CALCULATOR ========== -->
<section class="section roi-section" id="roi-calculator">
	<div class="container" use:reveal>
		<div class="roi-header">
			<span class="overline">Investment Tools</span>
			<h2>Calculate Your Return</h2>
			<p class="roi-header__sub">
				Project your investment returns in the Cyprus property market.
			</p>
		</div>
		<ROICalculator compact={true} />
	</div>
</section>

<!-- ========== WHY GROUNDZ ========== -->
<section class="section why-section">
	<div class="why-section__bg">
		<svg class="blueprint-bg" viewBox="0 0 800 600" fill="none" preserveAspectRatio="xMidYMid slice">
			<rect x="100" y="100" width="250" height="180" stroke="rgba(122,140,110,0.06)" stroke-width="1" fill="none"/>
			<rect x="120" y="120" width="80" height="60" stroke="rgba(122,140,110,0.04)" stroke-width="0.5" fill="none"/>
			<rect x="220" y="120" width="110" height="60" stroke="rgba(122,140,110,0.04)" stroke-width="0.5" fill="none"/>
			<rect x="120" y="200" width="210" height="60" stroke="rgba(122,140,110,0.04)" stroke-width="0.5" fill="none"/>
			<path d="M200 180 A15 15 0 0 1 215 165" stroke="rgba(122,140,110,0.05)" stroke-width="0.5" fill="none"/>
			<path d="M330 200 A15 15 0 0 0 315 215" stroke="rgba(122,140,110,0.05)" stroke-width="0.5" fill="none"/>
			<line x1="100" y1="300" x2="350" y2="300" stroke="rgba(122,140,110,0.04)" stroke-width="0.5"/>
			<line x1="100" y1="295" x2="100" y2="305" stroke="rgba(122,140,110,0.04)" stroke-width="0.5"/>
			<line x1="350" y1="295" x2="350" y2="305" stroke="rgba(122,140,110,0.04)" stroke-width="0.5"/>
			<rect x="450" y="300" width="200" height="150" stroke="rgba(122,140,110,0.05)" stroke-width="1" fill="none"/>
			<line x1="450" y1="370" x2="650" y2="370" stroke="rgba(122,140,110,0.03)" stroke-width="0.5"/>
			<rect x="480" y="320" width="60" height="40" stroke="rgba(122,140,110,0.03)" stroke-width="0.5" fill="none"/>
			<rect x="570" y="320" width="50" height="40" stroke="rgba(122,140,110,0.03)" stroke-width="0.5" fill="none"/>
		</svg>
	</div>
	<div class="container" style="position:relative; z-index:1">
		<div class="why-header" use:reveal>
			<span class="overline">Our Approach</span>
			<h2>Why Groundz</h2>
		</div>
		<div class="features-grid">
			<div class="feature" use:reveal={{ delay: 0 }}>
				<span class="feature__num">01</span>
				<h3 class="feature__title">Full Transparency</h3>
				<p class="feature__text">
					Real-time construction updates, document access, and payment tracking — everything in one dashboard from day one.
				</p>
			</div>
			<div class="feature" use:reveal={{ delay: 120 }}>
				<span class="feature__num">02</span>
				<h3 class="feature__title">Smart Investment</h3>
				<p class="feature__text">
					Data-driven ROI projections, market analytics, and expert advisory to help you make confident decisions.
				</p>
			</div>
			<div class="feature" use:reveal={{ delay: 240 }}>
				<span class="feature__num">03</span>
				<h3 class="feature__title">End-to-End Service</h3>
				<p class="feature__text">
					From property selection and legal review to residency applications and property management — we handle it all.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- ========== NEWS ROOM ========== -->
<section class="section news-section">
	<div class="container" use:reveal>
		<div class="section-head">
			<div>
				<span class="overline">Expert Insights</span>
				<h2 class="section-h2">News Room</h2>
				<p class="section-sub">Market analysis, investment guides, and developer updates from the Groundz team.</p>
			</div>
			<a href="/knowledge" class="btn-text-link">View all articles →</a>
		</div>
		<div class="news-grid">
			{#if data.articles.length > 0}
				{#each data.articles as article}
					<a href="/knowledge/{article.slug}" class="news-card">
						<div class="news-card__img">
							{#if article.imageUrl}
								<img src={article.imageUrl} alt={article.title} />
							{:else}
								<div class="news-card__placeholder-img">
									<svg viewBox="0 0 48 48" fill="none" width="28" height="28"><rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="18" x2="44" y2="18" stroke="currentColor" stroke-width="1"/><line x1="14" y1="26" x2="34" y2="26" stroke="currentColor" stroke-width="1"/><line x1="14" y1="31" x2="28" y2="31" stroke="currentColor" stroke-width="1"/></svg>
								</div>
							{/if}
							<span class="news-card__tag">{article.category}</span>
						</div>
						<div class="news-card__body">
							<h3 class="news-card__title">{article.title}</h3>
							{#if article.excerpt}<p class="news-card__excerpt">{article.excerpt}</p>{/if}
							<span class="news-card__read">Read →</span>
						</div>
					</a>
				{/each}
			{:else}
				{#each [
					{ tag: 'Market', title: 'Limassol Real Estate Market Report 2026', excerpt: 'An in-depth analysis of property price trends, rental yields, and investment opportunities in Limassol.' },
					{ tag: 'Investment', title: 'Why Cyprus Residency Through Property Remains Attractive', excerpt: 'A guide to the residency-by-investment programme and how the €300,000 threshold property route works.' },
					{ tag: 'Development', title: 'Sungardo Construction Update — Q1 2026', excerpt: 'Latest progress on the Sungardo residential complex: structural completion on schedule for Q3 2026 handover.' }
				] as item}
					<div class="news-card">
						<div class="news-card__img">
							<div class="news-card__placeholder-img">
								<svg viewBox="0 0 48 48" fill="none" width="28" height="28"><rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="18" x2="44" y2="18" stroke="currentColor" stroke-width="1"/><line x1="14" y1="26" x2="34" y2="26" stroke="currentColor" stroke-width="1"/><line x1="14" y1="31" x2="28" y2="31" stroke="currentColor" stroke-width="1"/></svg>
							</div>
							<span class="news-card__tag">{item.tag}</span>
						</div>
						<div class="news-card__body">
							<h3 class="news-card__title">{item.title}</h3>
							<p class="news-card__excerpt">{item.excerpt}</p>
							<span class="news-card__read">Read →</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</section>

<!-- ========== ABOUT US ========== -->
<section class="section about-section">
	<div class="container" use:reveal>
		<div class="about-grid">
			<div class="about-text">
				<span class="overline">Who We Are</span>
				<h2 class="section-h2">Shaping Life<br/><em>&amp; Investment</em></h2>
				<p class="about-p">
					Groundz is a full-cycle real estate developer based in Limassol, Cyprus. We manage every stage — from land acquisition and architectural design to construction, furnishing, and ongoing property management.
				</p>
				<p class="about-p">
					15+ completed projects, 300+ clients across 20+ countries. Our mission: make premium Cyprus real estate accessible, transparent, and genuinely rewarding for every buyer.
				</p>
				<a href="/about" class="btn btn--outline-dark">About the Company →</a>
			</div>
			<div class="services-list">
				{#each [
					{ num: '01', title: 'Full-cycle Development', desc: 'From site selection and design to construction and handover — every stage managed under one roof.' },
					{ num: '02', title: 'Turnkey Apartment Setup', desc: 'Fully furnished, ready-to-live-in homes with appliances, linens, and every detail thoughtfully prepared.' },
					{ num: '03', title: 'Property Management', desc: 'Tenant search, bookings, payment collection, and taxes — a fully hands-off rental experience.' },
					{ num: '04', title: 'Renovation & Interior Design', desc: 'Aesthetic and functional spaces tailored to your style, delivered without contractor complexity.' }
				] as svc}
					<div class="svc-item">
						<span class="svc-item__num">{svc.num}</span>
						<div class="svc-item__body">
							<h4 class="svc-item__title">{svc.title}</h4>
							<p class="svc-item__desc">{svc.desc}</p>
						</div>
						<span class="svc-item__arrow">→</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ========== PLATFORM + AI ========== -->
<section class="section platform-section">
	<div class="container" use:reveal>
		<div class="platform-layout">
			<div class="platform-visual">
				<div class="platform-icon">
					<svg viewBox="0 0 64 64" fill="none" width="48" height="48">
						<polygon points="32,4 36,26 58,32 36,38 32,60 28,38 6,32 28,26" fill="rgba(122,140,110,0.12)" stroke="rgba(122,140,110,0.55)" stroke-width="1.5"/>
						<polygon points="32,18 34,27 43,32 34,37 32,46 30,37 21,32 30,27" fill="rgba(122,140,110,0.3)"/>
					</svg>
				</div>
				<div class="platform-stats">
					{#each [{ n: '24/7', l: 'AI Concierge' }, { n: '100%', l: 'Digital Process' }, { n: 'Live', l: 'Tour Preview' }] as s}
						<div class="platform-stat">
							<span class="platform-stat__n">{s.n}</span>
							<span class="platform-stat__l">{s.l}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="platform-content">
				<span class="overline">Digital Platform</span>
				<h2 class="section-h2">Your Investment,<br/><em>Powered by AI</em></h2>
				<p class="platform-p">
					The Groundz platform gives buyers real-time access to construction progress, documents, payment schedules, and a personal AI concierge available 24/7. Select a property, book consultations, and track your entire investment journey in one place.
				</p>
				<div class="platform-feats">
					{#each ['AI property concierge', 'Live construction updates', 'Document vault', 'ROI analytics', 'Virtual apartment tours', '24/7 support chat'] as feat}
						<span class="platform-feat"><span class="platform-feat__dot"></span>{feat}</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ========== ROADMAP ========== -->
<section class="section roadmap-section">
	<div class="container" use:reveal>
		<div class="roadmap-head">
			<span class="overline">What's Coming</span>
			<h2 class="section-h2">Our Roadmap</h2>
			<p class="section-sub">Features we're building and improving on the Groundz platform.</p>
		</div>
		<div class="roadmap-grid">
			{#each [
				{ status: 'live',     label: 'Live',        title: 'AI Property Concierge',    desc: 'Conversational assistant for project info and consultation booking.' },
				{ status: 'live',     label: 'Live',        title: 'Virtual Tour Generation',  desc: 'AI-generated room-by-room tours for every unit before construction completes.' },
				{ status: 'progress', label: 'In Progress', title: 'Buyer Personal Cabinet',   desc: 'Real-time documents, payment schedules, and construction progress tracker.' },
				{ status: 'progress', label: 'In Progress', title: 'Interactive Floor Plans',  desc: '3D plan viewer with room dimensions and finish options per unit.' },
				{ status: 'planned',  label: 'Planned',     title: 'Investment Analytics',     desc: 'Market data, rental yield forecasts, and portfolio performance dashboards.' },
				{ status: 'planned',  label: 'Planned',     title: 'Legal & Residency Hub',    desc: 'Residency-by-investment workflow with document checklist and status tracking.' }
			] as item}
				<div class="roadmap-item roadmap-item--{item.status}">
					<span class="roadmap-item__badge">{item.label}</span>
					<h4 class="roadmap-item__title">{item.title}</h4>
					<p class="roadmap-item__desc">{item.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	/* ========== OVERLINE ========== */
	.overline {
		display: block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--color-accent);
		margin-bottom: var(--space-4);
	}

	.overline--light {
		color: var(--color-accent);
		opacity: 0.85;
	}

	/* ========== HERO — Fixed gradient + parallax layers ========== */
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin-top: calc(var(--header-height) * -1);
		padding-top: var(--header-height);
		overflow: hidden;
		/* THE gradient — fixed on the section, cream top → warm charcoal bottom */
		background: linear-gradient(
			to bottom,
			#f5f2ec 0%,
			#ece7dd 20%,
			#d2cbbf 40%,
			#a09889 58%,
			#706a63 72%,
			#514c48 85%,
			#44403d 100%
		);
	}

	/* Skyline parallax layer — moves SLOWER than scroll = parallax */
	.hero__skyline {
		position: absolute;
		bottom: 60px;
		left: 0;
		right: 0;
		z-index: 0;
		will-change: transform;
		pointer-events: none;
	}

	.hero__skyline-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	/* Text content — moves FASTER than scroll = parallax contrast */
	.hero__content {
		position: relative;
		z-index: 1;
		max-width: 780px;
		padding: var(--space-24) var(--space-6);
		will-change: transform;
	}

	.hero__tag {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--color-accent);
		margin-bottom: var(--space-8);
	}

	.hero__heading {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-7xl);
		color: var(--color-text);
		line-height: 1.05;
		margin-bottom: var(--space-6);
		letter-spacing: -0.01em;
	}

	.hero__subtitle {
		font-size: var(--text-lg);
		color: rgba(80, 75, 68, 0.8);
		line-height: 1.8;
		max-width: 520px;
		margin-bottom: var(--space-10);
	}

	.hero__cta {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	/* Custom outline button for gradient hero */
	.hero__cta :global(.btn--hero-outline) {
		background: transparent;
		border: 2px solid rgba(42, 40, 37, 0.35);
		color: var(--color-text);
	}

	.hero__cta :global(.btn--hero-outline:hover) {
		background: rgba(42, 40, 37, 0.08);
		border-color: rgba(42, 40, 37, 0.6);
		transform: translateY(-2px);
	}

	/* Stats bar — dark glass at bottom of gradient */
	.hero__bottom {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 2;
		border-top: 1px solid rgba(255, 255, 255, 0.10);
		background: rgba(0, 0, 0, 0.35);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
	}

	.hero__bottom-inner {
		display: flex;
		align-items: center;
	}

	.hero__stat {
		flex: 1;
		padding: var(--space-6) var(--space-4);
		text-align: center;
	}

	.hero__stat-num {
		display: block;
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-2xl);
		color: var(--color-text-light);
		line-height: 1.2;
		margin-bottom: var(--space-1);
	}

	.hero__stat-label {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
	}

	.hero__stat-divider {
		width: 1px;
		height: 40px;
		background: rgba(255, 255, 255, 0.10);
		flex-shrink: 0;
	}

	/* ========== WHY SECTION — with blueprint bg ========== */
	.why-section {
		background: var(--color-bg);
		padding: var(--space-24) 0;
		position: relative;
		overflow: hidden;
	}

	.why-section__bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.7;
	}

	.blueprint-bg {
		width: 100%;
		height: 100%;
	}

	.why-header {
		margin-bottom: var(--space-16);
	}

	.why-header h2 {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-4xl);
		line-height: 1.15;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-12);
	}

	.feature {
		padding: var(--space-8);
		background: rgba(0, 0, 0, 0.03);
		border: 1px solid rgba(0, 0, 0, 0.05);
		border-radius: var(--radius-lg);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
		transition: background var(--transition-fast), box-shadow var(--transition-fast);
	}

	.feature:hover {
		background: rgba(0, 0, 0, 0.05);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
	}

	.feature__num {
		display: block;
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
		margin-bottom: var(--space-6);
	}

	.feature__title {
		font-size: var(--text-xl);
		font-weight: 700;
		margin-bottom: var(--space-3);
		color: var(--color-text);
	}

	.feature__text {
		color: var(--color-text-body);
		font-size: var(--text-sm);
		line-height: 1.8;
		margin: 0;
	}

	/* ========== ROI SECTION ========== */
	.roi-section {
		background: var(--color-bg-alt);
	}

	.roi-header {
		margin-bottom: var(--space-12);
	}

	.roi-header h2 {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-4xl);
		line-height: 1.15;
		margin-bottom: var(--space-3);
	}

	.roi-header__sub {
		color: var(--color-text-muted);
		font-size: var(--text-base);
		margin: 0;
	}

	/* ========== PROJECTS SECTION ========== */
	.projects-section {
		background: var(--color-bg);
		position: relative;
		overflow: hidden;
	}

	.projects-section__bg-element {
		position: absolute;
		right: -60px;
		top: 0;
		bottom: 0;
		z-index: 0;
		pointer-events: none;
		opacity: 0.6;
		will-change: transform;
	}

	.projects-header {
		margin-bottom: var(--space-12);
	}

	.projects-header h2 {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-4xl);
		line-height: 1.15;
	}

	/* ========== CTA SECTION ========== */
	.cta-section {
		background: var(--color-bg-dark);
		color: var(--color-text-light);
		position: relative;
		overflow: hidden;
	}

	.cta-section__skyline {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 0;
		pointer-events: none;
	}

	.cta-section__skyline svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.cta-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-16);
		align-items: center;
	}

	.cta-title {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-4xl);
		color: var(--color-text-light);
		margin-bottom: var(--space-4);
		line-height: 1.15;
	}

	.cta-subtitle {
		color: rgba(255, 255, 255, 0.5);
		font-size: var(--text-base);
		line-height: 1.7;
		margin: 0;
	}

	/* ========== RESPONSIVE ========== */
	@media (max-width: 1024px) {
		.hero__heading {
			font-size: var(--text-5xl);
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: var(--space-8);
		}

		.cta-layout {
			grid-template-columns: 1fr;
			gap: var(--space-10);
		}

		.hero__stat-num {
			font-size: var(--text-xl);
		}

		.projects-section__bg-element {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.hero__heading { font-size: var(--text-4xl); }
		.hero__content { padding: var(--space-16) var(--space-4); }
		.hero__cta { flex-direction: column; }
		.hero__cta :global(.btn) { width: 100%; max-width: 320px; }
		.hero__bottom-inner { flex-wrap: wrap; }
		.hero__stat { flex: 0 0 50%; }
		.hero__stat-divider { display: none; }
		.hero__skyline { opacity: 0.5; }
		.why-header h2, .roi-header h2, .projects-header h2, .cta-title { font-size: var(--text-3xl); }
	}

	/* ========== SHARED NEW SECTION HELPERS ========== */
	.section-h2 {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-4xl);
		line-height: 1.15;
		color: var(--color-text);
		margin-bottom: var(--space-3);
	}
	.section-h2 em { font-style: italic; color: var(--color-accent); }

	.section-sub {
		color: var(--color-text-muted);
		font-size: var(--text-base);
		line-height: 1.7;
		margin: 0;
	}

	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-12);
		flex-wrap: wrap;
	}

	.btn-text-link {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-accent);
		text-decoration: none;
		white-space: nowrap;
		transition: opacity var(--transition-fast);
	}
	.btn-text-link:hover { opacity: 0.7; }

	.btn--outline-dark {
		display: inline-flex;
		align-items: center;
		padding: var(--space-3) var(--space-6);
		border: 1.5px solid rgba(60, 57, 50, 0.25);
		border-radius: var(--radius-base);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
		transition: border-color var(--transition-fast), background var(--transition-fast);
		margin-top: var(--space-6);
	}
	.btn--outline-dark:hover {
		border-color: var(--color-accent);
		background: rgba(122, 140, 110, 0.06);
	}

	/* ========== NEWS ROOM ========== */
	.news-section { background: var(--color-bg-alt); }

	.news-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-6);
	}

	.news-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		transition: box-shadow var(--transition-base), transform var(--transition-fast);
	}
	.news-card:hover {
		box-shadow: 0 8px 32px rgba(0,0,0,0.08);
		transform: translateY(-2px);
	}

	.news-card__img {
		position: relative;
		aspect-ratio: 16 / 9;
		background: var(--color-bg-alt);
		overflow: hidden;
	}
	.news-card__img img { width: 100%; height: 100%; object-fit: cover; display: block; }

	.news-card__placeholder-img {
		width: 100%; height: 100%;
		display: flex; align-items: center; justify-content: center;
		color: var(--color-text-muted);
	}

	.news-card__tag {
		position: absolute;
		top: var(--space-3);
		left: var(--space-3);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-accent);
		background: rgba(255,255,255,0.9);
		padding: 2px 8px;
		border-radius: 20px;
	}

	.news-card__body {
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
	}

	.news-card__title {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.4;
		margin: 0;
	}

	.news-card__excerpt {
		font-size: var(--text-sm);
		color: var(--color-text-body);
		line-height: 1.7;
		margin: 0;
		flex: 1;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.news-card__read {
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--color-accent);
		letter-spacing: 0.05em;
		margin-top: var(--space-2);
	}

	/* ========== ABOUT US ========== */
	.about-section { background: var(--color-bg); }

	.about-grid {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: var(--space-20);
		align-items: start;
	}

	.about-p {
		color: var(--color-text-body);
		font-size: var(--text-base);
		line-height: 1.85;
		margin: 0 0 var(--space-4);
	}

	.services-list {
		display: flex;
		flex-direction: column;
	}

	.svc-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-5);
		padding: var(--space-5) 0;
		border-bottom: 1px solid var(--color-border);
		cursor: default;
		transition: background var(--transition-base);
	}
	.svc-item:first-child { border-top: 1px solid var(--color-border); }
	.svc-item:hover .svc-item__arrow { opacity: 1; transform: translateX(4px); }

	.svc-item__num {
		font-size: var(--text-xs);
		font-weight: 800;
		letter-spacing: 0.12em;
		color: var(--color-accent);
		flex-shrink: 0;
		padding-top: 3px;
		width: 28px;
	}

	.svc-item__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.svc-item__title {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
		letter-spacing: 0.01em;
	}

	.svc-item__desc {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		line-height: 1.65;
		margin: 0;
	}

	.svc-item__arrow {
		font-size: var(--text-sm);
		color: var(--color-accent);
		flex-shrink: 0;
		opacity: 0;
		transition: opacity var(--transition-fast), transform var(--transition-fast);
		padding-top: 2px;
	}

	/* ========== PLATFORM + AI ========== */
	.platform-section { background: var(--color-bg-alt); }

	.platform-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: var(--space-20);
		align-items: center;
	}

	.platform-visual {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
	}

	.platform-icon {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		background: rgba(122,140,110,0.08);
		border: 1px solid rgba(122,140,110,0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.platform-stats {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
	}

	.platform-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.platform-stat__n {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-2xl);
		color: var(--color-accent);
		line-height: 1;
	}

	.platform-stat__l {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-top: var(--space-1);
	}

	.platform-p {
		font-size: var(--text-base);
		color: var(--color-text-body);
		line-height: 1.85;
		margin: 0 0 var(--space-8);
	}

	.platform-feats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.platform-feat {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-body);
		font-weight: 500;
	}

	.platform-feat__dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-accent);
		flex-shrink: 0;
	}

	/* ========== ROADMAP ========== */
	.roadmap-section { background: var(--color-bg); }

	.roadmap-head { margin-bottom: var(--space-12); }

	.roadmap-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-5);
	}

	.roadmap-item {
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		background: var(--color-bg-alt);
		position: relative;
	}

	.roadmap-item__badge {
		display: inline-block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 2px 9px;
		border-radius: 20px;
		margin-bottom: var(--space-4);
	}

	.roadmap-item--live {
		border-color: rgba(122,140,110,0.3);
		background: rgba(122,140,110,0.04);
	}
	.roadmap-item--live .roadmap-item__badge {
		background: rgba(122,140,110,0.15);
		color: var(--color-accent);
	}

	.roadmap-item--progress {
		border-color: rgba(245,158,11,0.25);
		background: rgba(245,158,11,0.03);
	}
	.roadmap-item--progress .roadmap-item__badge {
		background: rgba(245,158,11,0.15);
		color: #92400e;
	}

	.roadmap-item--planned .roadmap-item__badge {
		background: var(--color-bg);
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.roadmap-item__title {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 var(--space-2);
	}

	.roadmap-item__desc {
		font-size: var(--text-sm);
		color: var(--color-text-body);
		line-height: 1.7;
		margin: 0;
	}

	/* ========== RESPONSIVE ADDITIONS ========== */
	@media (max-width: 1024px) {
		.about-grid { grid-template-columns: 1fr; gap: var(--space-12); }
		.platform-layout { grid-template-columns: 1fr; gap: var(--space-10); }
		.platform-visual { flex-direction: row; justify-content: center; }
		.platform-stats { flex-direction: row; }
		.roadmap-grid { grid-template-columns: 1fr 1fr; }
		.news-grid { grid-template-columns: 1fr 1fr; }
		.section-h2 { font-size: var(--text-3xl); }
	}

	@media (max-width: 768px) {
		.news-grid { grid-template-columns: 1fr; }
		.services-grid { grid-template-columns: 1fr; }
		.roadmap-grid { grid-template-columns: 1fr; }
		.platform-visual { flex-direction: column; }
		.platform-stats { flex-direction: column; }
		.section-head { flex-direction: column; align-items: flex-start; }
		.section-h2 { font-size: var(--text-2xl); }
	}
</style>
