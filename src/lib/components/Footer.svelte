<script lang="ts">
	const projects = [
		{ label: 'Sungardo', href: '#' },
		{ label: 'Antigone Court', href: '#' },
		{ label: 'Symphony Residence', href: '#' },
		{ label: 'Cascada Residence', href: '#' },
		{ label: 'Ptolemy Studios', href: '#' }
	];

	const services = [
		'Property Development',
		'Investment Advisory',
		'Project Management',
		'Residency Consulting'
	];

	const company = [
		{ label: 'About Us', href: '#' },
		{ label: 'Knowledge Base', href: '/knowledge' },
		{ label: 'Careers', href: '#' },
		{ label: 'Contact', href: '/contact' }
	];
</script>

<footer class="footer">
	<div class="container">
		<div class="footer__top">
			<h3 class="footer__cta-title">Ready to invest in your future?</h3>
			<a href="/contact" class="btn btn--primary">Get Consultation</a>
		</div>

		<div class="footer__grid">
			<div class="footer__col footer__col--brand">
				<span class="footer__logo">DEVELTA</span>
				<address class="footer__address">
					<p>Limassol, Cyprus</p>
					<p><a href="tel:+35725123456">+357 25 123 456</a></p>
					<p><a href="mailto:info@develta.cy">info@develta.cy</a></p>
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
</footer>

<style>
	.footer {
		background: var(--color-bg-dark);
		color: var(--color-text-light);
		padding-top: 0;
	}

	.footer__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-12) 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.footer__cta-title {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-2xl);
		color: var(--color-text-light);
	}

	.footer__grid {
		display: grid;
		grid-template-columns: 1.5fr 1fr 1fr 1fr;
		gap: var(--space-10);
		padding: var(--space-12) 0;
	}

	.footer__logo {
		display: block;
		font-family: var(--font-body);
		font-weight: 700;
		font-size: var(--text-sm);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--color-text-light);
		margin-bottom: var(--space-5);
	}

	.footer__address {
		font-style: normal;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.4);
		line-height: 2;
	}

	.footer__address a {
		color: rgba(255, 255, 255, 0.4);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer__address a:hover {
		color: var(--color-accent);
	}

	.footer__heading {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: rgba(255, 255, 255, 0.6);
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
		color: rgba(255, 255, 255, 0.4);
	}

	.footer__list a {
		color: rgba(255, 255, 255, 0.4);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer__list a:hover {
		color: var(--color-text-light);
	}

	.footer__bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-6) 0;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.footer__copyright {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.25);
	}

	.footer__legal {
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.25);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.footer__legal a {
		color: rgba(255, 255, 255, 0.25);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer__legal a:hover {
		color: var(--color-accent);
	}

	@media (max-width: 1024px) {
		.footer__grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.footer__top {
			flex-direction: column;
			text-align: center;
			gap: var(--space-6);
		}
	}

	@media (max-width: 768px) {
		.footer__grid {
			grid-template-columns: 1fr;
			gap: var(--space-8);
		}

		.footer__bottom {
			flex-direction: column;
			gap: var(--space-3);
			text-align: center;
		}
	}
</style>
