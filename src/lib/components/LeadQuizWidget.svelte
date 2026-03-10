<script lang="ts">
	const options = [
		'В ближайшие 3 месяца',
		'В течение полугода',
		'В течение года',
		'Просто изучаю рынок'
	];
</script>

<div class="quiz-widget">
	<div class="quiz-widget__header">
		<div>
			<span class="quiz-widget__step">Шаг 1 из 5</span>
			<span class="quiz-widget__title">Подбор недвижимости</span>
		</div>
		<a href="/lead-quiz" class="quiz-widget__start">Начать &rarr;</a>
	</div>

	<div class="quiz-widget__body">
		<p class="quiz-widget__question">Когда планируете покупку недвижимости?</p>

		<div class="quiz-widget__options">
			{#each options as option}
				<div class="quiz-widget__option">
					<span class="quiz-widget__radio"></span>
					<span>{option}</span>
				</div>
			{/each}
		</div>

		<a href="/lead-quiz" class="btn btn--primary btn--full">Пройти подбор</a>
	</div>
</div>

<style>
	.quiz-widget {
		max-width: 480px;
		margin: 0 auto;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.10);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
	}

	.quiz-widget__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		background: rgba(0, 0, 0, 0.3);
		color: var(--color-text-light);
	}

	.quiz-widget__step {
		display: block;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: 2px;
	}

	.quiz-widget__title {
		display: block;
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.quiz-widget__start {
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--color-accent);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.quiz-widget__start:hover {
		color: var(--color-accent-hover);
	}

	.quiz-widget__body {
		padding: var(--space-6);
	}

	.quiz-widget__question {
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-lg);
		color: var(--color-text-light);
		margin-bottom: var(--space-5);
		line-height: 1.3;
	}

	.quiz-widget__options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
	}

	.quiz-widget__option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: 1.5px solid rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		transition: all var(--transition-fast);
		background: rgba(255, 255, 255, 0.04);
	}

	.quiz-widget__option:hover {
		border-color: var(--color-accent);
		background: rgba(255, 255, 255, 0.08);
	}

	.quiz-widget__radio {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
		transition: border-color var(--transition-fast);
	}

	.quiz-widget__option:hover .quiz-widget__radio {
		border-color: var(--color-accent);
	}
</style>
