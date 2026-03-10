<script lang="ts">
	import { animateCounter } from '$lib/utils/scroll-reveal';

	interface Props {
		label: string;
		value: string;
		suffix?: string;
		description: string;
	}

	let { label, value, suffix = '', description }: Props = $props();

	let numericValue = $derived(parseInt(value.replace(/[^0-9]/g, ''), 10));
	let hasPrefix = $derived(value.startsWith('€') || value.startsWith('$'));
	let prefix = $derived(hasPrefix ? value.charAt(0) : '');
	let isNumeric = $derived(!isNaN(numericValue) && numericValue > 0);
</script>

<div class="kpi">
	<span class="kpi__label">{label}</span>
	<div class="kpi__value-row">
		{#if isNumeric}
			<span class="kpi__value" use:animateCounter={{ target: numericValue, suffix: '', prefix }}>{prefix}0</span>
		{:else}
			<span class="kpi__value">{value}</span>
		{/if}
		{#if suffix}
			<span class="kpi__suffix">{suffix}</span>
		{/if}
	</div>
	<span class="kpi__desc">{description}</span>
</div>

<style>
	.kpi {
		text-align: center;
		padding: var(--space-8) var(--space-4);
	}

	.kpi__label {
		display: block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	.kpi__value-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 2px;
		margin-bottom: var(--space-2);
	}

	.kpi__value {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-5xl);
		color: var(--color-text);
		line-height: 1;
	}

	.kpi__suffix {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-2xl);
		color: var(--color-accent);
		line-height: 1;
	}

	.kpi__desc {
		display: block;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}
</style>
