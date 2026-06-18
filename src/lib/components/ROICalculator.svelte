<script lang="ts">
	import { formatCurrency, roundPercent } from '$lib/utils/formatters';
	import { platformStore } from '$lib/stores/platform';

	interface Props {
		compact?: boolean;
	}

	let { compact = false }: Props = $props();

	let price = $state(450000);
	let vatRate = $state(0.05);

	$effect(() => {
		platformStore.update((s) => ({ ...s, selectedPropertyPrice: price }));
	});

	let vatAmount = $derived(price * vatRate);
	let totalCapital = $derived(price + vatAmount);
	let grossRental = $derived(price * 0.07);
	let managementCost = $derived(grossRental * 0.10);
	let netIncome = $derived(grossRental - managementCost);
	let netROI = $derived((netIncome / totalCapital) * 100);
	let prEligible = $derived(price >= 300000);
	let sliderProgress = $derived(((price - 150000) / (2000000 - 150000)) * 100);

	function setVatRate(rate: number) {
		vatRate = rate;
	}
</script>

<div class="roi" class:roi--compact={compact}>
	<div class="roi__left">
		<div class="roi__field">
			<span class="roi__label">Property Price</span>
			<span class="roi__price">{formatCurrency(price)}</span>
		</div>

		<div class="roi__slider-wrap">
			<input
				type="range"
				class="roi__slider"
				min={150000}
				max={2000000}
				step={10000}
				bind:value={price}
				aria-label="Property price"
				style="--progress: {sliderProgress}%"
			/>
			<div class="roi__slider-labels">
				<span>{formatCurrency(150000)}</span>
				<span>{formatCurrency(2000000)}</span>
			</div>
		</div>

		<div class="roi__field">
			<span class="roi__label">VAT Rate</span>
			<div class="roi__vat-toggle">
				<button
					class="roi__vat-btn"
					class:roi__vat-btn--active={vatRate === 0.05}
					onclick={() => setVatRate(0.05)}
				>5% Primary Residence</button>
				<button
					class="roi__vat-btn"
					class:roi__vat-btn--active={vatRate === 0.19}
					onclick={() => setVatRate(0.19)}
				>19% Standard / Investment</button>
			</div>
		</div>

		{#if prEligible}
			<div class="roi__pr-badge">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
					<circle cx="9" cy="9" r="8" stroke="#22c55e" stroke-width="1.5" fill="none"/>
					<path d="M5.5 9l2.5 2.5 4.5-5" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				</svg>
				<div>
					<strong>Cyprus PR Eligible</strong>
					<p>Qualifies for Permanent Residency fast-track (&ge; &euro;300,000).</p>
				</div>
			</div>
		{/if}
	</div>

	<div class="roi__right">
		<h4 class="roi__section-title">Financial Summary</h4>

		<div class="roi__row">
			<span>Property Price</span>
			<span>{formatCurrency(price)}</span>
		</div>
		<div class="roi__row">
			<span>VAT ({vatRate === 0.05 ? '5%' : '19%'})</span>
			<span>{formatCurrency(vatAmount)}</span>
		</div>

		<div class="roi__divider"></div>

		<div class="roi__row roi__row--total">
			<span>Total Capital Required</span>
			<span class="roi__highlight">{formatCurrency(totalCapital)}</span>
		</div>

		<div class="roi__divider"></div>

		<h4 class="roi__section-title">Annual Yield Projection</h4>

		<div class="roi__row">
			<span>Gross Rental Income (Est. 7%)</span>
			<span>{formatCurrency(grossRental)}</span>
		</div>
		<div class="roi__row">
			<span>Management &amp; Maintenance (10%)</span>
			<span>&minus;{formatCurrency(managementCost)}</span>
		</div>
		<div class="roi__row">
			<span>Net Annual Income</span>
			<span>{formatCurrency(netIncome)}</span>
		</div>

		<div class="roi__divider"></div>

		<div class="roi__result">
			<span class="roi__result-label">Projected Net ROI</span>
			<span class="roi__result-value">{roundPercent(netROI).toFixed(2)}%</span>
		</div>
	</div>
</div>

<style>
	.roi {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
	}

	.roi__left {
		padding: var(--space-10);
		background: rgba(255, 255, 255, 0.7);
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.roi__field {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.roi__label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.roi__price {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-4xl);
		color: var(--color-text);
		line-height: 1.1;
	}

	.roi__slider-wrap {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.roi__slider {
		width: 100%;
		height: 4px;
		appearance: none;
		background: linear-gradient(
			to right,
			var(--color-primary) 0%,
			var(--color-primary) var(--progress, 50%),
			var(--color-border) var(--progress, 50%),
			var(--color-border) 100%
		);
		border-radius: var(--radius-full);
		outline: none;
		cursor: pointer;
	}

	.roi__slider::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		background: var(--color-primary);
		border: 3px solid #fff;
		border-radius: 50%;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		cursor: pointer;
	}

	.roi__slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--color-primary);
		border: 3px solid #fff;
		border-radius: 50%;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		cursor: pointer;
	}

	.roi__slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.roi__vat-toggle {
		display: flex;
		gap: var(--space-3);
	}

	.roi__vat-btn {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 600;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.roi__vat-btn--active {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		color: var(--color-primary);
	}

	.roi__pr-badge {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(34, 197, 94, 0.05);
		border: 1px solid rgba(34, 197, 94, 0.15);
		border-radius: var(--radius-md);
		align-items: flex-start;
	}

	.roi__pr-badge svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.roi__pr-badge strong {
		color: var(--color-success);
		font-size: var(--text-sm);
		display: block;
		margin-bottom: 2px;
	}

	.roi__pr-badge p {
		font-size: var(--text-sm);
		color: var(--color-text-body);
		margin: 0;
		line-height: 1.5;
	}

	/* Right panel — dark frosted glass */
	.roi__right {
		padding: var(--space-10);
		background: rgba(30, 30, 28, 0.85);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		color: var(--color-text-light);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.roi__section-title {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: var(--space-1);
	}

	.roi__row {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.55);
	}

	/* Tabular figures — mono + aligned digits */
	.roi__row span:last-child,
	.roi__highlight {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	.roi__row--total {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-text-light);
	}

	.roi__highlight {
		color: var(--color-text-light);
		font-weight: 700;
		font-size: var(--text-xl);
	}

	.roi__divider {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin: var(--space-2) 0;
	}

	.roi__result {
		margin-top: auto;
		padding: var(--space-6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.roi__result-label {
		display: block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: var(--space-2);
	}

	.roi__result-value {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-5xl);
		color: var(--color-text-light);
		line-height: 1;
	}

	@media (max-width: 768px) {
		.roi {
			grid-template-columns: 1fr;
		}

		.roi__left,
		.roi__right {
			padding: var(--space-8) var(--space-6);
		}

		.roi__vat-toggle {
			flex-direction: column;
		}

		.roi__price {
			font-size: var(--text-3xl);
		}
	}
</style>
