<script lang="ts">
	interface Props {
		label: string;
		value: string;
		suffix?: string;
		description?: string;
	}

	let { label, value, suffix, description }: Props = $props();
</script>

<div class="kpi-card">
	<span class="kpi-card__label">{label}</span>
	<div class="kpi-card__value">
		{value}{#if suffix}<span class="kpi-card__suffix">{suffix}</span>{/if}
	</div>
	{#if description}
		<span class="kpi-card__description">{description}</span>
	{/if}
</div>

<style>
	.kpi-card {
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		padding: var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.kpi-card__label {
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
	}

	.kpi-card__value {
		font-family: var(--font-body);
		font-size: var(--text-4xl);
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.1;
	}

	.kpi-card__suffix {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--color-text-muted);
		margin-left: var(--space-1);
	}

	.kpi-card__description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}
</style>
