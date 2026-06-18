<script lang="ts">
	import { locale, setLocale } from '$lib/stores/locale';
	import { t } from '$lib/i18n';

	interface User {
		id: string;
		email: string;
		role: string;
		name?: string;
	}

	interface Props {
		user: User | null;
		transparent?: boolean;
	}

	let { user, transparent = false }: Props = $props();

	const cabinetHref = $derived(
		user?.role === 'internal_team' ? '/admin'
		: user?.role === 'buyer' ? '/buyer'
		: user?.role === 'investor' ? '/investor'
		: user?.role === 'agent' ? '/agent'
		: null
	);

	let mobileOpen = $state(false);
	let scrolled = $state(false);

	const navLinks = $derived([
		{ label: t($locale, 'nav.home'), href: '/' },
		{ label: t($locale, 'nav.projects'), href: '/projects' },
		{ label: t($locale, 'nav.knowledge'), href: '/knowledge' },
		{ label: t($locale, 'nav.about'), href: '/about' },
		{ label: t($locale, 'nav.contact'), href: '/contact' }
	]);

	const investLinks = $derived([
		{ label: t($locale, 'nav.pools'), href: '/pools', desc: 'Browse active pools' },
		{ label: t($locale, 'nav.pricing'), href: '/pricing', desc: 'Tiers, ticket limits, perks' },
		{ label: t($locale, 'nav.howItWorks'), href: '/invest/how-it-works', desc: 'SPV structure, returns' },
		{ label: t($locale, 'nav.protections'), href: '/invest/protections', desc: 'Security & guarantees' },
		{ label: t($locale, 'nav.apply'), href: '/invest/apply', desc: 'Submit your application' },
	]);

	const mobileInvestLinks = $derived(investLinks.map(l => ({ label: l.label, href: l.href })));

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}

	function closeMobile() {
		mobileOpen = false;
	}

	$effect(() => {
		function handleScroll() {
			scrolled = window.scrollY > 40;
		}
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<header class="nav" class:nav--transparent={transparent && !scrolled} class:nav--scrolled={scrolled}>
	<div class="nav__inner container">
		<a href="/" class="nav__logo">GROUNDZ</a>

		<nav class="nav__desktop" aria-label="Main navigation">
			{#each navLinks as link}
				<a href={link.href} class="nav__link">{link.label}</a>
			{/each}

			<!-- Invest dropdown -->
			<div class="nav__dropdown">
				<button class="nav__link nav__dropdown-trigger" type="button">
					{t($locale, 'nav.invest')} <span class="nav__dropdown-caret">▾</span>
				</button>
				<div class="nav__dropdown-panel">
					{#each investLinks as item}
						<a href={item.href} class="nav__dropdown-item">
							<span class="nav__dropdown-item-label">{item.label}</span>
							<span class="nav__dropdown-item-desc">{item.desc}</span>
						</a>
					{/each}
				</div>
			</div>

			{#if user && cabinetHref}
				<a href={cabinetHref} class="nav__link nav__link--cabinet">{t($locale, 'nav.cabinet')}</a>
			{/if}
			<div class="nav__lang" role="group" aria-label="Language">
				<button type="button" class="nav__lang-btn" class:nav__lang-btn--active={$locale === 'en'} onclick={() => setLocale('en')}>EN</button>
				<span class="nav__lang-sep">/</span>
				<button type="button" class="nav__lang-btn" class:nav__lang-btn--active={$locale === 'ru'} onclick={() => setLocale('ru')}>RU</button>
			</div>
			{#if user}
				<div class="nav__user">
					<span class="nav__user-name">{user.name || user.email}</span>
					<span class="badge badge--info">{user.role}</span>
					<form method="POST" action="/auth/logout">
						<button type="submit" class="btn btn--sm btn--outline">Logout</button>
					</form>
				</div>
			{:else}
				<a href="/auth/login" class="btn btn--sm btn--primary">{t($locale, 'nav.login')}</a>
			{/if}
		</nav>

		<button
			class="nav__burger"
			onclick={toggleMobile}
			aria-label="Open menu"
			aria-expanded={mobileOpen}
		>
			<span class="nav__burger-line"></span>
			<span class="nav__burger-line"></span>
		</button>
	</div>
</header>

{#if mobileOpen}
	<div class="sidebar-backdrop" onclick={closeMobile} role="presentation"></div>
{/if}
<aside class="sidebar" class:sidebar--open={mobileOpen}>
	<div class="sidebar__header">
		<span class="nav__logo">GROUNDZ</span>
		<button class="sidebar__close" onclick={closeMobile} aria-label="Close menu">
			&#10005;
		</button>
	</div>
	<nav class="sidebar__nav" aria-label="Mobile navigation">
		{#each navLinks as link}
			<a href={link.href} class="sidebar__link" onclick={closeMobile}>{link.label}</a>
		{/each}
		<div class="sidebar__group-label">Invest</div>
		{#each mobileInvestLinks as link}
			<a href={link.href} class="sidebar__link sidebar__link--sub" onclick={closeMobile}>{link.label}</a>
		{/each}
		{#if user && cabinetHref}
			<a href={cabinetHref} class="sidebar__link" onclick={closeMobile}>Cabinet</a>
		{/if}
	</nav>
	<div class="sidebar__footer">
		{#if user}
			<div class="sidebar__user">
				<span class="sidebar__user-name">{user.name || user.email}</span>
				<form method="POST" action="/auth/logout" style="width:100%">
					<button type="submit" class="btn btn--sm btn--outline" style="width:100%">Logout</button>
				</form>
			</div>
		{:else}
			<a href="/auth/login" class="btn btn--sm btn--primary" style="width:100%" onclick={closeMobile}>Login</a>
		{/if}
	</div>
</aside>

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: var(--header-height);
		z-index: 100;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border-light);
		transition: all 0.3s ease;
	}

	.nav--transparent {
		background: transparent;
		border-bottom-color: transparent;
	}

	.nav--transparent .nav__logo,
	.nav--transparent .nav__link,
	.nav--transparent .nav__lang {
		color: var(--color-text);
	}

	.nav--transparent .nav__burger-line {
		background: var(--color-text);
	}

	.nav--scrolled {
		background: var(--color-bg);
		border-bottom-color: var(--color-border-light);
	}

	.nav--scrolled .nav__logo,
	.nav--scrolled .nav__link {
		color: var(--color-text);
	}

	.nav__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.nav__logo {
		font-family: var(--font-body);
		font-weight: 700;
		font-size: var(--text-sm);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--color-text);
		text-decoration: none;
		flex-shrink: 0;
		transition: color var(--transition-fast);
	}

	.nav__logo:hover {
		color: var(--color-accent);
	}

	.nav__desktop {
		display: flex;
		align-items: center;
		gap: var(--space-8);
	}

	.nav__link {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		letter-spacing: 0.02em;
		transition: color var(--transition-fast);
		white-space: nowrap;
	}

	.nav__link:hover {
		color: var(--color-accent);
	}

	/* Dropdown */
	.nav__dropdown {
		position: relative;
	}

	.nav__dropdown-trigger {
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-body);
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0;
	}

	.nav__dropdown-caret {
		font-size: 9px;
		opacity: 0.6;
		transition: transform var(--transition-fast);
	}

	.nav__dropdown:hover .nav__dropdown-caret {
		transform: rotate(180deg);
	}

	.nav__dropdown-panel {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		min-width: 220px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 32px rgba(0,0,0,0.1);
		padding: var(--space-2);
		padding-top: 14px;
		opacity: 0;
		pointer-events: none;
		transform: translateX(-50%) translateY(-4px);
		transition: opacity 0.18s ease, transform 0.18s ease;
		z-index: 200;
	}

	.nav__dropdown:hover .nav__dropdown-panel {
		opacity: 1;
		pointer-events: auto;
		transform: translateX(-50%) translateY(0);
	}

	.nav__dropdown-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background var(--transition-fast);
	}

	.nav__dropdown-item:hover {
		background: var(--color-bg-alt);
	}

	.nav__dropdown-item-label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.nav__dropdown-item-desc {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.nav__lang {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		text-transform: uppercase;
		padding: var(--space-1) var(--space-2);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.nav__lang-btn {
		background: none;
		border: none;
		padding: 0 2px;
		font: inherit;
		letter-spacing: inherit;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.nav__lang-btn--active {
		color: var(--color-primary);
	}

	.nav__lang-btn:hover {
		color: var(--color-primary);
	}

	.nav__lang-sep {
		opacity: 0.4;
	}

	.nav__user {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.nav__user-name {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
	}

	.nav__burger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 7px;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-2);
	}

	.nav__burger-line {
		display: block;
		width: 24px;
		height: 1.5px;
		background: var(--color-text);
		transition: background var(--transition-fast);
	}

	/* Sidebar */
	.sidebar-backdrop {
		position: fixed;
		inset: 0;
		z-index: 149;
		background: rgba(0, 0, 0, 0.4);
	}

	.sidebar {
		position: fixed;
		top: 0;
		right: 0;
		width: 320px;
		max-width: 85vw;
		height: 100vh;
		z-index: 150;
		background: var(--color-bg);
		transform: translateX(100%);
		transition: transform var(--transition-base);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.sidebar--open {
		transform: translateX(0);
	}

	.sidebar__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-6);
		border-bottom: 1px solid var(--color-border-light);
	}

	.sidebar__close {
		background: none;
		border: none;
		cursor: pointer;
		font-size: var(--text-lg);
		color: var(--color-text);
		padding: var(--space-2);
		line-height: 1;
	}

	.sidebar__close:hover {
		color: var(--color-accent);
	}

	.sidebar__nav {
		display: flex;
		flex-direction: column;
		padding: var(--space-6);
		gap: 0;
		flex: 1;
	}

	.sidebar__link {
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		padding: var(--space-4) 0;
		border-bottom: 1px solid var(--color-border-light);
		transition: color var(--transition-fast);
	}

	.sidebar__link:hover {
		color: var(--color-accent);
	}

	.sidebar__group-label {
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-accent);
		padding: var(--space-4) 0 var(--space-2);
	}

	.sidebar__link--sub {
		padding-left: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.sidebar__footer {
		padding: var(--space-6);
		border-top: 1px solid var(--color-border-light);
	}

	.sidebar__user {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.sidebar__user-name {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	@media (max-width: 768px) {
		.nav__desktop {
			display: none;
		}
		.nav__burger {
			display: flex;
		}
	}
</style>
