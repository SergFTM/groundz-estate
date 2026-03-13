<script lang="ts">
	const projects = [
		{ label: 'Sungardo', href: '/projects/sungardo' },
		{ label: 'Antigone Court', href: '/projects/antigone-court' },
		{ label: 'Symphony Residence', href: '/projects/symphony-residence' },
		{ label: 'Cascada Residence', href: '/projects/cascada-residence' },
		{ label: 'Ptolemy Studios', href: '/projects/ptolemy-studios' }
	];

	const services = [
		'Property Development',
		'Investment Advisory',
		'Project Management',
		'Residency Consulting'
	];

	const company = [
		{ label: 'Knowledge Base', href: '/knowledge' },
		{ label: 'Investment Pools', href: '/investment' },
		{ label: 'How It Works', href: '/invest/how-it-works' },
		{ label: 'Investor Protections', href: '/invest/protections' },
		{ label: 'Apply as Investor', href: '/invest/apply' },
		{ label: 'Careers', href: '/jobs' },
		{ label: 'Contact', href: '/contact' }
	];
</script>

<footer class="footer">

	<!-- ── CTA PARALLAX SECTION ─────────────────── -->
	<div class="footer__cta">
		<!-- Building silhouettes for CTA -->
		<svg class="footer__cta-skyline" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
			<defs>
				<pattern id="wg-wide" x="0" y="0" width="22" height="20" patternUnits="userSpaceOnUse">
					<rect x="0" y="0" width="22" height="3" fill="rgba(255,255,255,0.022)"/>
					<rect x="1" y="4" width="9" height="15" fill="rgba(255,255,255,0.012)"/>
					<rect x="12" y="4" width="9" height="15" fill="rgba(255,255,255,0.012)"/>
				</pattern>
				<pattern id="wg-narrow" x="0" y="0" width="17" height="18" patternUnits="userSpaceOnUse">
					<rect x="0" y="0" width="17" height="2.5" fill="rgba(255,255,255,0.02)"/>
					<rect x="1" y="3.5" width="6.5" height="13" fill="rgba(255,255,255,0.01)"/>
					<rect x="9.5" y="3.5" width="6.5" height="13" fill="rgba(255,255,255,0.01)"/>
				</pattern>
				<linearGradient id="bldg-fade" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
					<stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
				</linearGradient>
				<radialGradient id="city-glow" cx="50%" cy="100%" r="60%">
					<stop offset="0%" stop-color="rgba(180,160,100,0.07)"/>
					<stop offset="100%" stop-color="rgba(0,0,0,0)"/>
				</radialGradient>
			</defs>

			<!-- City glow from below -->
			<rect x="0" y="0" width="1440" height="520" fill="url(#city-glow)"/>

			<!-- Far-left low-rise cluster -->
			<rect x="0" y="330" width="120" height="190" fill="rgba(255,255,255,0.028)"/>
			<rect x="130" y="290" width="85" height="230" fill="rgba(255,255,255,0.035)"/>
			<rect x="130" y="290" width="85" height="230" fill="url(#wg-narrow)"/>

			<!-- Left tower with cap -->
			<rect x="270" y="120" width="95" height="400" fill="url(#bldg-fade)"/>
			<rect x="270" y="120" width="95" height="400" fill="url(#wg-wide)"/>
			<rect x="282" y="80" width="71" height="44" fill="rgba(255,255,255,0.05)"/>
			<rect x="282" y="80" width="71" height="44" fill="url(#wg-wide)"/>
			<!-- Mullions -->
			<line x1="302" y1="80" x2="302" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
			<line x1="320" y1="80" x2="320" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
			<line x1="338" y1="80" x2="338" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>

			<!-- Center-left mid tower -->
			<rect x="430" y="90" width="110" height="430" fill="rgba(255,255,255,0.042)"/>
			<rect x="430" y="90" width="110" height="430" fill="url(#wg-wide)"/>
			<rect x="445" y="55" width="80" height="40" fill="rgba(255,255,255,0.042)"/>
			<!-- Podium base -->
			<rect x="400" y="410" width="170" height="110" fill="rgba(255,255,255,0.028)"/>

			<!-- DOMINANT CENTER TOWER -->
			<rect x="648" y="10" width="148" height="510" fill="rgba(255,255,255,0.055)"/>
			<rect x="648" y="10" width="148" height="510" fill="url(#wg-wide)"/>
			<!-- Spire -->
			<rect x="710" y="0" width="24" height="14" fill="rgba(255,255,255,0.055)"/>
			<!-- Mullions -->
			<line x1="676" y1="10" x2="676" y2="520" stroke="rgba(255,255,255,0.022)" stroke-width="1"/>
			<line x1="704" y1="10" x2="704" y2="520" stroke="rgba(255,255,255,0.022)" stroke-width="1"/>
			<line x1="732" y1="10" x2="732" y2="520" stroke="rgba(255,255,255,0.022)" stroke-width="1"/>
			<line x1="760" y1="10" x2="760" y2="520" stroke="rgba(255,255,255,0.022)" stroke-width="1"/>
			<line x1="788" y1="10" x2="788" y2="520" stroke="rgba(255,255,255,0.022)" stroke-width="1"/>
			<!-- Podium -->
			<rect x="600" y="420" width="244" height="100" fill="rgba(255,255,255,0.035)"/>

			<!-- Center-right tower -->
			<rect x="870" y="80" width="105" height="440" fill="rgba(255,255,255,0.045)"/>
			<rect x="870" y="80" width="105" height="440" fill="url(#wg-wide)"/>
			<rect x="882" y="45" width="81" height="40" fill="rgba(255,255,255,0.045)"/>
			<line x1="898" y1="45" x2="898" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
			<line x1="922" y1="45" x2="922" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
			<line x1="946" y1="45" x2="946" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>

			<!-- Right cluster back -->
			<rect x="1050" y="200" width="80" height="320" fill="rgba(255,255,255,0.03)"/>
			<rect x="1050" y="200" width="80" height="320" fill="url(#wg-narrow)"/>

			<!-- Right tall tower -->
			<rect x="1150" y="90" width="105" height="430" fill="rgba(255,255,255,0.048)"/>
			<rect x="1150" y="90" width="105" height="430" fill="url(#wg-wide)"/>
			<rect x="1163" y="55" width="79" height="40" fill="rgba(255,255,255,0.048)"/>
			<line x1="1178" y1="55" x2="1178" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
			<line x1="1203" y1="55" x2="1203" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>
			<line x1="1228" y1="55" x2="1228" y2="520" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>

			<!-- Far-right block -->
			<rect x="1310" y="220" width="90" height="300" fill="rgba(255,255,255,0.028)"/>
			<rect x="1310" y="220" width="90" height="300" fill="url(#wg-narrow)"/>
			<rect x="1410" y="270" width="30" height="250" fill="rgba(255,255,255,0.022)"/>
		</svg>

		<div class="footer__cta-inner">
			<span class="footer__cta-overline">Limassol · Cyprus · Est. 2018</span>
			<h2 class="footer__cta-headline">
				Ready to invest<br/>in your future?
			</h2>
			<p class="footer__cta-sub">
				Premium residential developments with guaranteed<br class="footer__br"/>
				rental yields and EU residency benefits.
			</p>
			<div class="footer__cta-actions">
				<a href="/contact" class="footer__cta-btn footer__cta-btn--primary">Get Consultation</a>
				<a href="/projects" class="footer__cta-btn footer__cta-btn--ghost">View Projects</a>
			</div>
		</div>
	</div>

	<!-- ── FOOTER BODY ───────────────────────────── -->
	<div class="footer__body">

		<!-- Building silhouettes (subtle, behind content) -->
		<svg class="footer__body-skyline" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
			<rect x="150" y="140" width="80" height="180" fill="rgba(255,255,255,0.022)"/>
			<rect x="420" y="60" width="100" height="260" fill="rgba(255,255,255,0.028)"/>
			<rect x="648" y="20" width="148" height="300" fill="rgba(255,255,255,0.032)"/>
			<rect x="600" y="250" width="244" height="70" fill="rgba(255,255,255,0.02)"/>
			<rect x="870" y="55" width="100" height="265" fill="rgba(255,255,255,0.026)"/>
			<rect x="1150" y="70" width="100" height="250" fill="rgba(255,255,255,0.024)"/>
			<rect x="1310" y="170" width="80" height="150" fill="rgba(255,255,255,0.018)"/>
		</svg>

		<div class="container">
			<div class="footer__grid">
				<div class="footer__col footer__col--brand">
					<span class="footer__logo">DEVELTA</span>
					<address class="footer__address">
						<p>Arch. Makariou III, 198<br/>Marinos Court, Office 4-5<br/>3030 Limassol, Cyprus</p>
						<p><a href="tel:+35794098889">+357 94 098 889</a></p>
						<p><a href="tel:+35725335100">+357 25 335 100</a></p>
						<p><a href="mailto:sales@develta.cy">sales@develta.cy</a></p>
					</address>
				</div>

				<div class="footer__col">
					<h4 class="footer__heading">Projects</h4>
					<ul class="footer__list">
						{#each projects as project}
							<li><a href={project.href}>{project.label}</a></li>
						{/each}
					</ul>
				</div>

				<div class="footer__col">
					<h4 class="footer__heading">Services</h4>
					<ul class="footer__list">
						{#each services as service}
							<li><span>{service}</span></li>
						{/each}
					</ul>
				</div>

				<div class="footer__col">
					<h4 class="footer__heading">Company</h4>
					<ul class="footer__list">
						{#each company as item}
							<li><a href={item.href}>{item.label}</a></li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="footer__bottom">
				<span class="footer__copyright">
					&copy; 2026 Develta Group. All rights reserved. License HE 450620
				</span>
				<span class="footer__legal">
					<a href="/privacy">Privacy Policy</a>
					<span>&middot;</span>
					<a href="/terms">Terms of Service</a>
				</span>
			</div>
		</div>
	</div>

</footer>

<style>
	/* ── CTA SECTION ───────────────────────────── */
	.footer__cta {
		position: relative;
		overflow: hidden;
		min-height: 420px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(175deg, #0f0f0d 0%, #141412 35%, #191816 65%, #1a1916 100%);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	/* Stars / fine grain texture */
	.footer__cta::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle at 15% 25%, rgba(255,255,255,0.025) 1px, transparent 1px),
			radial-gradient(circle at 72% 18%, rgba(255,255,255,0.02) 1px, transparent 1px),
			radial-gradient(circle at 43% 55%, rgba(255,255,255,0.015) 1px, transparent 1px),
			radial-gradient(circle at 88% 40%, rgba(255,255,255,0.02) 1px, transparent 1px),
			radial-gradient(circle at 60% 10%, rgba(255,255,255,0.025) 1px, transparent 1px),
			radial-gradient(circle at 30% 70%, rgba(255,255,255,0.015) 1px, transparent 1px),
			radial-gradient(circle at 5% 80%, rgba(255,255,255,0.018) 1px, transparent 1px);
		pointer-events: none;
	}

	.footer__cta-skyline {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: auto;
		pointer-events: none;
	}

	.footer__cta-inner {
		position: relative;
		z-index: 2;
		text-align: center;
		padding: var(--space-16) var(--space-6);
		max-width: 700px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
	}

	.footer__cta-overline {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-accent);
		opacity: 0.85;
	}

	.footer__cta-headline {
		font-family: 'IvyoraDisplay', serif;
		font-weight: 300;
		font-style: italic;
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		line-height: 1.15;
		color: rgba(255, 255, 255, 0.95);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.footer__cta-sub {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.38);
		line-height: 1.75;
		margin: 0;
		letter-spacing: 0.01em;
	}

	.footer__cta-actions {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: var(--space-2);
	}

	.footer__cta-btn {
		display: inline-flex;
		align-items: center;
		height: 44px;
		padding: 0 var(--space-7);
		border-radius: 100px;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-decoration: none;
		transition: all var(--transition-base);
	}

	.footer__cta-btn--primary {
		background: var(--color-accent);
		color: #fff;
		border: 1.5px solid var(--color-accent);
		box-shadow: 0 0 24px rgba(122, 140, 110, 0.2);
	}

	.footer__cta-btn--primary:hover {
		opacity: 0.88;
		box-shadow: 0 0 36px rgba(122, 140, 110, 0.3);
		transform: translateY(-1px);
	}

	.footer__cta-btn--ghost {
		background: transparent;
		color: rgba(255, 255, 255, 0.55);
		border: 1.5px solid rgba(255, 255, 255, 0.14);
	}

	.footer__cta-btn--ghost:hover {
		border-color: rgba(255, 255, 255, 0.28);
		color: rgba(255, 255, 255, 0.8);
	}

	/* ── FOOTER BODY ───────────────────────────── */
	.footer__body {
		position: relative;
		overflow: hidden;
		background: linear-gradient(to bottom, #161614 0%, #121210 100%);
	}

	.footer__body-skyline {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: auto;
		pointer-events: none;
		opacity: 0.85;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--space-6);
		position: relative;
		z-index: 1;
	}

	.footer__grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr 1fr 1fr;
		gap: var(--space-10);
		padding: var(--space-14) 0 var(--space-12);
	}

	.footer__logo {
		display: block;
		font-family: var(--font-body);
		font-weight: 700;
		font-size: var(--text-sm);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: var(--space-5);
	}

	.footer__address {
		font-style: normal;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.32);
		line-height: 2;
	}

	.footer__address a {
		color: rgba(255, 255, 255, 0.32);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer__address a:hover {
		color: var(--color-accent);
	}

	.footer__heading {
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.28);
		margin-bottom: var(--space-5);
	}

	.footer__list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.footer__list li {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.35);
	}

	.footer__list a {
		color: rgba(255, 255, 255, 0.35);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer__list a:hover {
		color: rgba(255, 255, 255, 0.75);
	}

	.footer__bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) 0;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.footer__copyright {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.18);
		letter-spacing: 0.03em;
	}

	.footer__legal {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.18);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.footer__legal a {
		color: rgba(255, 255, 255, 0.18);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer__legal a:hover {
		color: var(--color-accent);
	}

	/* ── Responsive ────────────────────────────── */
	.footer__br { display: block; }

	@media (max-width: 1024px) {
		.footer__grid { grid-template-columns: repeat(2, 1fr); }
	}

	@media (max-width: 768px) {
		.footer__grid {
			grid-template-columns: 1fr;
			gap: var(--space-8);
		}
		.footer__cta-inner { padding: var(--space-12) var(--space-6); }
		.footer__bottom {
			flex-direction: column;
			gap: var(--space-3);
			text-align: center;
		}
		.footer__br { display: none; }
	}

	@media (max-width: 480px) {
		.footer__cta-actions { flex-direction: column; width: 100%; }
		.footer__cta-btn { justify-content: center; width: 100%; }
	}
</style>
