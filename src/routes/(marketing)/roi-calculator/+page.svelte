<script lang="ts">
	import ROICalculator from '$lib/components/ROICalculator.svelte';
</script>

<svelte:head>
	<title>Investment Projection — Groundz</title>
	<meta name="description" content="Calculate your potential return on investment for Cyprus real estate. Explore rental yields, capital appreciation, and net profit projections with our interactive ROI calculator." />
</svelte:head>

<div class="roi-page">
	<section class="section">
		<div class="container">
			<div class="roi-page__header">
				<span class="roi-page__badge text-uppercase">Cyprus Market ROI Calculator</span>
				<h1 class="roi-page__title">Investment Projection</h1>
				<p class="roi-page__subtitle">
					Model your potential returns from Cyprus real estate investment.
					Adjust the parameters to see how purchase price, rental income, and market appreciation
					affect your projected ROI.
				</p>
			</div>

			<ROICalculator />
		</div>
	</section>

	<section class="section section--dark">
		<div class="container">
			<div class="roi-cta">
				<h2 class="roi-cta__title">Ready to Invest?</h2>
				<p class="roi-cta__text">
					Our team of investment advisors can help you find the right property
					to match your financial goals. Schedule a free consultation today.
				</p>
				<div class="roi-cta__actions">
					<a href="/lead-forms" class="btn btn--primary btn--lg">Book a Consultation</a>
					<a href="/lead-quiz" class="btn btn--outline-light btn--lg">Take Property Quiz</a>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.roi-page__header {
		text-align: center;
		margin-bottom: var(--space-16);
		max-width: var(--container-narrow);
		margin-left: auto;
		margin-right: auto;
	}

	.roi-page__badge {
		display: inline-block;
		color: var(--color-accent);
		margin-bottom: var(--space-4);
	}

	.roi-page__title {
		font-family: var(--font-display);
		font-size: var(--text-5xl);
		color: var(--color-text);
		margin-bottom: var(--space-6);
	}

	.roi-page__subtitle {
		color: var(--color-text-muted);
		font-size: var(--text-lg);
		line-height: 1.7;
	}

	.roi-cta {
		text-align: center;
		max-width: 640px;
		margin: 0 auto;
	}

	.roi-cta__title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		margin-bottom: var(--space-4);
	}

	.roi-cta__text {
		color: var(--color-text-muted);
		font-size: var(--text-lg);
		margin-bottom: var(--space-8);
	}

	.roi-cta__actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.roi-page__title {
			font-size: var(--text-3xl);
		}

		.roi-cta__actions {
			flex-direction: column;
		}

		.roi-cta__actions .btn {
			width: 100%;
		}
	}
</style>
