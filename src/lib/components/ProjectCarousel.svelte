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

	function getStartingPrice(project: Project): string {
		if (project.units.length === 0) {
			return project.status === 'coming_soon' ? 'Coming Soon' : 'Sold Out';
		}
		const unit = project.units[0];
		return unit.price ? `From ${formatCurrency(unit.price)}` : 'Coming Soon';
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
			<article class="carousel__card">
				<div class="carousel__image">
					{#if project.imageUrl}
						<img src={project.imageUrl} alt={project.name} />
					{:else}
						<div class="carousel__placeholder">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
								<rect x="4" y="10" width="24" height="18" rx="1" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" fill="none"/>
								<path d="M4 22l7-6 6 5 5-3 6 4" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" fill="none"/>
							</svg>
							<span>{project.name}</span>
						</div>
					{/if}
					<span class="carousel__status carousel__status--{project.status}">
						{getStatusLabel(project.status)}
					</span>
				</div>
				<div class="carousel__body">
					<span class="carousel__location">{project.location}</span>
					<h3 class="carousel__name">{project.name}</h3>
					<span class="carousel__price">{getStartingPrice(project)}</span>
					<a href="/projects/{project.slug}" class="carousel__link">
						View Details
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</a>
				</div>
			</article>
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

	.carousel__card {
		flex: 0 0 calc((100% - var(--space-6) * 2) / 3);
		scroll-snap-align: start;
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: rgba(255, 255, 255, 0.6);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		transition: all var(--transition-base);
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
	}

	.carousel__card:hover {
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
		transform: translateY(-4px);
	}

	.carousel__image {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 10;
		overflow: hidden;
	}

	.carousel__image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s ease;
	}

	.carousel__card:hover .carousel__image img {
		transform: scale(1.03);
	}

	.carousel__placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #2a2a28 0%, #3a3a36 50%, #2e2e2a 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		color: rgba(255, 255, 255, 0.25);
		font-family: var(--font-display);
		font-weight: 300;
		font-style: italic;
		font-size: var(--text-base);
	}

	.carousel__status {
		position: absolute;
		top: var(--space-3);
		left: var(--space-3);
		padding: var(--space-1) var(--space-3);
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-radius: var(--radius-sm);
	}

	.carousel__status--active {
		background: rgba(34, 197, 94, 0.9);
		color: #fff;
	}

	.carousel__status--coming_soon {
		background: rgba(245, 158, 11, 0.9);
		color: #fff;
	}

	.carousel__status--completed {
		background: rgba(120, 120, 120, 0.9);
		color: #fff;
	}

	.carousel__body {
		padding: var(--space-5) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.carousel__location {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.carousel__name {
		font-size: var(--text-lg);
		font-weight: 700;
	}

	.carousel__price {
		font-weight: 600;
		color: var(--color-accent);
		font-size: var(--text-base);
		margin-bottom: var(--space-2);
	}

	.carousel__link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
		transition: color var(--transition-fast);
		margin-top: auto;
	}

	.carousel__link:hover {
		color: var(--color-accent);
	}

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

	@media (max-width: 1024px) {
		.carousel__card {
			flex: 0 0 calc((100% - var(--space-6)) / 2);
		}
	}

	@media (max-width: 768px) {
		.carousel__card {
			flex: 0 0 85%;
		}
	}
</style>
