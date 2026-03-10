<script lang="ts">
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

	const navLinks = [
		{ label: 'Home', href: '/' },
		{ label: 'Projects', href: '/projects' },
		{ label: 'Investment', href: '/investment' },
		{ label: 'Knowledge Base', href: '/knowledge' },
		{ label: 'Contact', href: '/contact' }
	];

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
		<a href="/" class="nav__logo">DEVELTA</a>

		<nav class="nav__desktop" aria-label="Main navigation">
			{#each navLinks as link}
				<a href={link.href} class="nav__link">{link.label}</a>
			{/each}
			{#if user && cabinetHref}
				<a href={cabinetHref} class="nav__link nav__link--cabinet">Cabinet</a>
			{/if}
			<span class="nav__lang">EN</span>
			{#if user}
				<div class="nav__user">
					<span class="nav__user-name">{user.name || user.email}</span>
					<span class="badge badge--info">{user.role}</span>
					<form method="POST" action="/auth/logout">
						<button type="submit" class="btn btn--sm btn--outline">Logout</button>
					</form>
				</div>
			{:else}
				<a href="/auth/login" class="btn btn--sm btn--primary">Login</a>
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
		<span class="nav__logo">DEVELTA</span>
		<button class="sidebar__close" onclick={closeMobile} aria-label="Close menu">
			&#10005;
		</button>
	</div>
	<nav class="sidebar__nav" aria-label="Mobile navigation">
		{#each navLinks as link}
			<a href={link.href} class="sidebar__link" onclick={closeMobile}>{link.label}</a>
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

	.nav__lang {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		text-transform: uppercase;
		padding: var(--space-1) var(--space-3);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
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
