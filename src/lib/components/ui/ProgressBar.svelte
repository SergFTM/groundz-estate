<script lang="ts">
	interface Props {
		value: number;
		label?: string;
		showPercent?: boolean;
	}

	let { value, label, showPercent = true }: Props = $props();

	let clampedValue = $derived(Math.min(100, Math.max(0, value)));
</script>

<div class="progress" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
	{#if label || showPercent}
		<div class="progress__header">
			{#if label}
				<span class="progress__label">{label}</span>
			{/if}
			{#if showPercent}
				<span class="progress__percent">{clampedValue}%</span>
			{/if}
		</div>
	{/if}
	<div class="progress__track">
		<div class="progress__fill" style="width: {clampedValue}%"></div>
	</div>
</div>

<style>
	.progress {
		width: 100%;
	}

	.progress__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.progress__label {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-text);
	}

	.progress__percent {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.progress__track {
		width: 100%;
		height: 8px;
		background: var(--color-border-light);
		overflow: hidden;
	}

	.progress__fill {
		height: 100%;
		background: var(--color-accent);
		transition: width var(--transition-base);
	}
</style>
