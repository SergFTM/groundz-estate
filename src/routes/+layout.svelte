<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { platformStore } from '$lib/stores/platform';
	import { locale } from '$lib/stores/locale';
	import NavigationMenu from '$lib/components/NavigationMenu.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	let isLandingPage = $derived($page.url.pathname === '/');

	// Sync UI locale from server (cookie-resolved) + reflect on <html lang>
	$effect(() => {
		locale.set(data.locale);
		document.documentElement.lang = data.locale;
	});

	$effect(() => {
		if (data.user) {
			platformStore.set({
				isAuthenticated: true,
				userRole: data.user.role,
				userName: data.user.name ?? data.user.email,
				selectedPropertyPrice: 450000
			});
		} else {
			platformStore.set({
				isAuthenticated: false,
				userRole: null,
				userName: null,
				selectedPropertyPrice: 450000
			});
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<NavigationMenu user={data.user} transparent={isLandingPage} />

<main class="main-content" class:main-content--no-pad={isLandingPage}>
	{@render children()}
</main>

<Footer />
<CookieConsent />
<Toast />

<style>
	.main-content {
		/* Nav is sticky/in-flow (occupies its own space) — no offset needed */
		padding-top: 0;
		min-height: 100vh;
	}

	.main-content--no-pad {
		padding-top: 0;
	}
</style>
