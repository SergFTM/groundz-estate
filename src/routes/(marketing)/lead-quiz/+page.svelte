<script lang="ts">
	import { enhance } from '$app/forms';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let step = $state(1);
	let timing = $state('');
	let purpose = $state('');
	let budget = $state('');
	let installment = $state('');
	let name = $state('');
	let phone = $state('');
	let submitted = $state(false);
	let submitting = $state(false);

	let progress = $derived(Math.round(((step - 1) / 5) * 100));
	let totalSteps = 5;

	$effect(() => {
		if (form?.success) {
			submitted = true;
			submitting = false;
		}
		if (form?.step) {
			step = form.step;
			submitting = false;
		}
	});

	const timingOptions = [
		{ value: '1-3 месяца', label: 'В ближайшие 1-3 месяца' },
		{ value: '3-6 месяцев', label: 'В течение 3-6 месяцев' },
		{ value: 'в течение года', label: 'В течение года' },
		{ value: 'интересуюсь', label: 'Пока только интересуюсь' }
	];

	const purposeOptions = [
		{ value: 'проживание', label: 'Для постоянного проживания' },
		{ value: 'инвестиция', label: 'Инвестиция' },
		{ value: 'и то, и другое', label: 'И то, и другое' }
	];

	const budgetOptions = [
		{ value: 'до €200k', label: 'До €200,000' },
		{ value: '€200k — €500k', label: '€200,000 — €500,000' },
		{ value: '€500k — €1M', label: '€500,000 — €1,000,000' },
		{ value: 'более €1M', label: 'Более €1,000,000' }
	];

	const installmentOptions = [
		{ value: 'да', label: 'Да, это важно' },
		{ value: 'возможно', label: 'Возможно, хочу узнать условия' },
		{ value: 'нет', label: 'Нет, планирую полную оплату' }
	];

	function selectOption(field: 'timing' | 'purpose' | 'budget' | 'installment', value: string) {
		if (field === 'timing') timing = value;
		else if (field === 'purpose') purpose = value;
		else if (field === 'budget') budget = value;
		else if (field === 'installment') installment = value;

		if (step < 5) {
			setTimeout(() => {
				step = step + 1;
			}, 300);
		}
	}

	function goBack() {
		if (step > 1) step = step - 1;
	}

	function goNext() {
		if (step < totalSteps) step = step + 1;
	}

	function canAdvance(): boolean {
		if (step === 1) return timing !== '';
		if (step === 2) return purpose !== '';
		if (step === 3) return budget !== '';
		if (step === 4) return installment !== '';
		return true;
	}
</script>

<svelte:head>
	<title>Подбор недвижимости — Develta</title>
</svelte:head>

{#if submitted}
	<div class="quiz-page">
		<div class="quiz-container">
			<div class="thank-you">
				<div class="thank-you__icon">
					<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="32" cy="32" r="32" fill="var(--color-accent)" />
						<path d="M20 32L28 40L44 24" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<h2 class="thank-you__title">Спасибо!</h2>
				<p class="thank-you__text">Мы свяжемся с вами в ближайшее время.</p>
				<a href="/" class="btn btn--primary">Вернуться на главную</a>
			</div>
		</div>
	</div>
{:else}
	<div class="quiz-page">
		<div class="quiz-header">
			<div class="quiz-header__inner">
				<span class="quiz-header__title">ПОДБОР НЕДВИЖИМОСТИ</span>
				<span class="quiz-header__progress">{progress}% ГОТОВО</span>
			</div>
			<ProgressBar value={progress} showPercent={false} />
		</div>

		<div class="quiz-container">
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<input type="hidden" name="timing" value={timing} />
				<input type="hidden" name="purpose" value={purpose} />
				<input type="hidden" name="budget" value={budget} />
				<input type="hidden" name="installment" value={installment} />

				{#if step === 1}
					<div class="quiz-step">
						<h2 class="quiz-question">Когда планируете покупку недвижимости?</h2>
						<div class="quiz-options">
							{#each timingOptions as option}
								<button
									type="button"
									class="quiz-option"
									class:quiz-option--selected={timing === option.value}
									onclick={() => selectOption('timing', option.value)}
								>
									{option.label}
								</button>
							{/each}
						</div>
						{#if form?.errors?.timing}
							<p class="form-error">{form.errors.timing}</p>
						{/if}
					</div>
				{:else if step === 2}
					<div class="quiz-step">
						<h2 class="quiz-question">Цель покупки</h2>
						<div class="quiz-options">
							{#each purposeOptions as option}
								<button
									type="button"
									class="quiz-option"
									class:quiz-option--selected={purpose === option.value}
									onclick={() => selectOption('purpose', option.value)}
								>
									{option.label}
								</button>
							{/each}
						</div>
						{#if form?.errors?.purpose}
							<p class="form-error">{form.errors.purpose}</p>
						{/if}
					</div>
				{:else if step === 3}
					<div class="quiz-step">
						<h2 class="quiz-question">Ваш бюджет</h2>
						<div class="quiz-options">
							{#each budgetOptions as option}
								<button
									type="button"
									class="quiz-option"
									class:quiz-option--selected={budget === option.value}
									onclick={() => selectOption('budget', option.value)}
								>
									{option.label}
								</button>
							{/each}
						</div>
						{#if form?.errors?.budget}
							<p class="form-error">{form.errors.budget}</p>
						{/if}
					</div>
				{:else if step === 4}
					<div class="quiz-step">
						<h2 class="quiz-question">Интересует ли вас рассрочка?</h2>
						<div class="quiz-options">
							{#each installmentOptions as option}
								<button
									type="button"
									class="quiz-option"
									class:quiz-option--selected={installment === option.value}
									onclick={() => selectOption('installment', option.value)}
								>
									{option.label}
								</button>
							{/each}
						</div>
						{#if form?.errors?.installment}
							<p class="form-error">{form.errors.installment}</p>
						{/if}
					</div>
				{:else if step === 5}
					<div class="quiz-step">
						<h2 class="quiz-question">Оставьте ваши контакты</h2>
						<p class="quiz-subtitle">Мы подберём лучшие варианты и свяжемся с вами</p>

						<div class="quiz-form">
							<div class="form-group">
								<label class="form-label" for="quiz-name">Ваше имя</label>
								<input
									class="form-input"
									type="text"
									id="quiz-name"
									name="name"
									placeholder="Введите ваше имя"
									bind:value={name}
									required
								/>
								{#if form?.errors?.name}
									<p class="form-error">{form.errors.name}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="quiz-phone">Телефон</label>
								<input
									class="form-input"
									type="tel"
									id="quiz-phone"
									name="phone"
									placeholder="+357 XX XXX XXX"
									bind:value={phone}
									required
								/>
								{#if form?.errors?.phone}
									<p class="form-error">{form.errors.phone}</p>
								{/if}
							</div>

							<button
								class="btn btn--primary btn--full btn--lg"
								type="submit"
								disabled={submitting || !name || !phone}
							>
								{submitting ? 'Отправка...' : 'Отправить'}
							</button>
						</div>
					</div>
				{/if}

				<div class="quiz-nav">
					{#if step > 1}
						<button type="button" class="quiz-nav__back" onclick={goBack}>
							&larr; Назад
						</button>
					{:else}
						<span></span>
					{/if}

					{#if step < 5}
						<button
							type="button"
							class="btn btn--primary"
							onclick={goNext}
							disabled={!canAdvance()}
						>
							Далее &rarr;
						</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.quiz-page {
		min-height: calc(100vh - var(--header-height, 80px));
		background: var(--color-bg-alt);
	}

	.quiz-header {
		background: var(--color-bg-dark);
		padding: var(--space-4) 0 0;
	}

	.quiz-header__inner {
		max-width: var(--container-max);
		margin: 0 auto;
		padding: 0 var(--space-6) var(--space-4);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.quiz-header__title {
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-light);
	}

	.quiz-header__progress {
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-accent);
	}

	.quiz-container {
		max-width: 640px;
		margin: 0 auto;
		padding: var(--space-12) var(--space-6);
	}

	.quiz-step {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.quiz-question {
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		color: var(--color-text);
		margin-bottom: var(--space-8);
		text-align: center;
	}

	.quiz-subtitle {
		text-align: center;
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
	}

	.quiz-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.quiz-option {
		display: block;
		width: 100%;
		padding: var(--space-5) var(--space-6);
		background: var(--color-bg);
		border: 2px solid var(--color-border);
		font-family: var(--font-body);
		font-size: var(--text-base);
		color: var(--color-text);
		text-align: left;
		cursor: pointer;
		transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
	}

	.quiz-option:hover {
		border-color: var(--color-accent);
		box-shadow: var(--shadow-sm);
	}

	.quiz-option--selected {
		border-color: var(--color-accent);
		background: var(--color-accent-light);
		font-weight: 600;
	}

	.quiz-form {
		max-width: 400px;
		margin: 0 auto;
	}

	.quiz-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--space-10);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.quiz-nav__back {
		background: none;
		border: none;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: var(--space-2) var(--space-3);
		transition: color var(--transition-fast);
	}

	.quiz-nav__back:hover {
		color: var(--color-text);
	}

	/* Thank-you screen */
	.thank-you {
		text-align: center;
		padding: var(--space-20) 0;
	}

	.thank-you__icon {
		margin-bottom: var(--space-6);
	}

	.thank-you__title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		color: var(--color-text);
		margin-bottom: var(--space-4);
	}

	.thank-you__text {
		color: var(--color-text-muted);
		font-size: var(--text-lg);
		margin-bottom: var(--space-8);
	}

	@media (max-width: 768px) {
		.quiz-question {
			font-size: var(--text-2xl);
		}

		.quiz-container {
			padding: var(--space-8) var(--space-4);
		}
	}
</style>
