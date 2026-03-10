<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		open: boolean;
		onclose: () => void;
		children: Snippet;
	}

	let { open, onclose, children }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onclose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="modal-overlay"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
	>
		<div class="modal-card" transition:fly={{ y: 30, duration: 300 }}>
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6);
	}

	.modal-card {
		background: var(--color-bg);
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		overflow-y: auto;
		padding: var(--space-10);
		position: relative;
	}

	@media (max-width: 600px) {
		.modal-card {
			padding: var(--space-6);
			max-width: 100%;
		}
	}
</style>
