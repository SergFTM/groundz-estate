<script lang="ts">
	import { formatCurrency } from '$lib/utils/formatters';

	interface Unit {
		id: string;
		price: number | null;
	}

	interface Project {
		id: string;
		name: string;
		slug: string;
		location: string;
		description?: string | null;
		imageUrl?: string | null;
		status: string;
		units: Unit[];
	}

	interface Props {
		projects: Project[];
	}

	let { projects }: Props = $props();

	let activeDot = $state(0);
	let scrollContainer: HTMLDivElement | undefined = $state();

	let totalDots = $derived(Math.max(1, projects.length - 2));

	function getStartingPrice(project: Project): string | null {
		if (project.units.length === 0) return null;
		const unit = project.units[0];
		return unit.price ? formatCurrency(unit.price) : null;
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active': return 'Active';
			case 'coming_soon': return 'Coming Soon';
			case 'completed': return 'Completed';
			default: return status;
		}
	}

	function scrollToDot(index: number) {
		activeDot = index;
		if (scrollContainer) {
			const card = scrollContainer.querySelector('.carousel__card') as HTMLElement;
			if (card) {
				const cardWidth = card.offsetWidth + 24;
				scrollContainer.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
			}
		}
	}

	function handleScroll() {
		if (scrollContainer) {
			const card = scrollContainer.querySelector('.carousel__card') as HTMLElement;
			if (card) {
				const cardWidth = card.offsetWidth + 24;
				activeDot = Math.round(scrollContainer.scrollLeft / cardWidth);
			}
		}
	}
</script>

<div class="carousel">
	<div class="carousel__track" bind:this={scrollContainer} onscroll={handleScroll}>
		{#each projects as project}
			<a href="/projects/{project.slug}" class="carousel__card">
				<!-- Full-bleed image -->
				{#if project.imageUrl}
					<img class="carousel__img" src={project.imageUrl} alt={project.name} />
				{:else}
					<div class="carousel__placeholder"></div>
				{/if}

				<!-- Gradient overlay -->
				<div class="carousel__gradient"></div>

				<!-- Status badge -->
				<span class="carousel__status carousel__status--{project.status}">
					{getStatusLabel(project.status)}
				</span>

				<!-- Bottom content -->
				<div class="carousel__body">
					<div class="carousel__location">{project.location}</div>
					<h3 class="carousel__name">{project.name}</h3>
					<div class="carousel__divider"></div>
					<div class="carousel__footer">
						{#if getStartingPrice(project)}
							<div class="carousel__price-wrap">
								<span class="carousel__price-label">From</span>
								<span class="carousel__price">{getStartingPrice(project)}</span>
							</div>
						{:else}
							<span class="carousel__price carousel__price--na">
								{project.status === 'coming_soon' ? 'Coming Soon' : '–'}
							</span>
						{/if}
						<span class="carousel__cta" aria-hidden="true">→</span>
					</div>
				</div>
			</a>
		{/each}
	</div>

	{#if projects.length > 3}
		<div class="carousel__dots">
			{#each Array(totalDots) as _, i}
				<button
					class="carousel__dot"
					class:carousel__dot--active={activeDot === i}
					onclick={() => scrollToDot(i)}
					aria-label="Go to slide {i + 1}"
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* ── Track ── */
	.carousel__track {
		display: flex;
		gap: var(--space-6);
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-bottom: var(--space-2);
	}

	.carousel__track::-webkit-scrollbar {
		display: none;
	}

	/* ── Card ── */
	.carousel__card {
		position: relative;
		flex: 0 0 calc((100% - var(--space-6) * 2) / 3);
		scroll-snap-align: start;
		aspect-ratio: 3 / 4;
		border-radius: 16px;
		overflow: hidden;
		background: #1a1917;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
		transition: transform 0.35s ease, box-shadow 0.35s ease;
		display: block;
	}

	.carousel__card:hover {
		transform: translateY(-6px);
		box-shadow: 0 32px 80px rgba(0, 0, 0, 0.34);
	}

	/* ── Image ── */
	.carousel__img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.85;
		transition: opacity 0.4s ease, transform 0.55s ease;
	}

	.carousel__card:hover .carousel__img {
		opacity: 0.72;
		transform: scale(1.04);
	}

	.carousel__placeholder {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #2a2a28 0%, #3a3a36 50%, #2e2e2a 100%);
	}

	/* ── Gradient overlay ── */
	.carousel__gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			transparent 28%,
			rgba(20, 18, 16, 0.28) 52%,
			rgba(20, 18, 16, 0.92) 100%
		);
		pointer-events: none;
	}

	/* ── Status badge ── */
	.carousel__status {
		position: absolute;
		top: 18px;
		left: 18px;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #fff;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		padding: 5px 10px;
		border-radius: 4px;
		z-index: 1;
	}

	.carousel__status--active    { background: rgba(122, 140, 110, 0.88); }
	.carousel__status--coming_soon { background: rgba(180, 130, 60, 0.85); }
	.carousel__status--completed { background: rgba(80, 80, 78, 0.85); }

	/* ── Body ── */
	.carousel__body {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 24px 22px 22px;
		z-index: 1;
	}

	.carousel__location {
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.48);
		margin-bottom: 6px;
	}

	.carousel__name {
		font-family: 'Ivyora Display', Georgia, 'Times New Roman', serif;
		font-weight: 300;
		font-style: italic;
		font-size: clamp(1.25rem, 2vw, 1.65rem);
		color: #fff;
		line-height: 1.15;
		margin: 0 0 12px;
	}

	.carousel__divider {
		width: 28px;
		height: 1px;
		background: rgba(122, 140, 110, 0.65);
		margin-bottom: 12px;
	}

	/* ── Footer ── */
	.carousel__footer {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.carousel__price-wrap {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.carousel__price-label {
		font-size: 0.56rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.35);
	}

	.carousel__price {
		font-family: 'Ivyora Display', Georgia, 'Times New Roman', serif;
		font-weight: 300;
		font-style: italic;
		font-size: 1.2rem;
		color: #fff;
		line-height: 1;
	}

	.carousel__price--na {
		font-family: inherit;
		font-style: normal;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
	}

	/* ── Arrow circle ── */
	.carousel__cta {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.22);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 0.95rem;
		flex-shrink: 0;
		transition: background 0.2s, border-color 0.2s;
	}

	.carousel__card:hover .carousel__cta {
		background: rgba(122, 140, 110, 0.6);
		border-color: transparent;
	}

	/* ── Dots ── */
	.carousel__dots {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
		margin-top: var(--space-8);
	}

	.carousel__dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		border: none;
		background: var(--color-border);
		cursor: pointer;
		padding: 0;
		transition: all var(--transition-fast);
	}

	.carousel__dot--active {
		background: var(--color-accent);
		width: 20px;
		border-radius: var(--radius-full);
	}

	/* ── Responsive ── */
	@media (max-width: 1024px) {
		.carousel__card {
			flex: 0 0 calc((100% - var(--space-6)) / 2);
		}
	}

	@media (max-width: 768px) {
		.carousel__card {
			flex: 0 0 80%;
		}
	}
</style>
