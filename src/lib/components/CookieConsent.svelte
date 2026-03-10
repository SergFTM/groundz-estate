<script lang="ts">
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'develta-cookies';

	let visible = $state(false);

	$effect(() => {
		if (browser) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				visible = true;
			}
		}
	});

	function accept() {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, 'accepted');
		}
		visible = false;
	}

	function reject() {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, 'rejected');
		}
		visible = false;
	}
</script>

{#if visible}
	<div class="cookie-banner" transition:fly={{ y: 80, duration: 400 }}>
		<div class="cookie-banner__inner container">
			<p class="cookie-banner__text">
				We use cookies to improve your experience. By continuing, you agree to our cookie policy.
			</p>
			<div class="cookie-banner__actions">
				<button class="btn btn--primary btn--sm" onclick={accept}>Accept All</button>
				<button class="btn btn--outline-light btn--sm" onclick={reject}>Reject Optional</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.cookie-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 99;
		background: var(--color-bg-dark);
		padding: var(--space-6) 0;
	}

	.cookie-banner__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-8);
	}

	.cookie-banner__text {
		font-size: var(--text-sm);
		color: #ccc;
		margin-bottom: 0;
		flex: 1;
	}

	.cookie-banner__actions {
		display: flex;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.cookie-banner__inner {
			flex-direction: column;
			text-align: center;
			gap: var(--space-4);
		}

		.cookie-banner__actions {
			width: 100%;
			justify-content: center;
		}
	}
</style>
