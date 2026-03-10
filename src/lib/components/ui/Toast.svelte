<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toastStore } from '$lib/stores/platform';

	let toasts = $state<Array<{ id: number; type: 'success' | 'error' | 'info'; message: string }>>([]);

	toastStore.subscribe((value) => {
		toasts = value;
	});
</script>

{#if toasts.length > 0}
	<div class="toast-container" aria-live="polite">
		{#each toasts as toast (toast.id)}
			<div
				class="toast toast--{toast.type}"
				transition:fly={{ x: 80, duration: 300 }}
			>
				<span class="toast__message">{toast.message}</span>
				<button
					class="toast__dismiss"
					onclick={() => toastStore.dismiss(toast.id)}
					aria-label="Dismiss"
				>
					&#10005;
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: var(--space-6);
		right: var(--space-6);
		z-index: 200;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 400px;
		width: 100%;
	}

	.toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-left: 4px solid;
		padding: var(--space-4) var(--space-5);
		box-shadow: var(--shadow-lg);
	}

	.toast--success {
		border-left-color: var(--color-success);
	}

	.toast--error {
		border-left-color: var(--color-error);
	}

	.toast--info {
		border-left-color: var(--color-info);
	}

	.toast__message {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.5;
		flex: 1;
	}

	.toast__dismiss {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: var(--text-base);
		padding: var(--space-1);
		line-height: 1;
		flex-shrink: 0;
		transition: color var(--transition-fast);
	}

	.toast__dismiss:hover {
		color: var(--color-text);
	}

	@media (max-width: 480px) {
		.toast-container {
			left: var(--space-4);
			right: var(--space-4);
			bottom: var(--space-4);
			max-width: none;
		}
	}
</style>
