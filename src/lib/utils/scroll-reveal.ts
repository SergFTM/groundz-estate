/**
 * Scroll Reveal — Intersection Observer based reveal animations
 * Usage: <div use:reveal> or <div use:reveal={{ threshold: 0.2, delay: 200 }}>
 */

interface RevealOptions {
	threshold?: number;
	delay?: number;
	rootMargin?: string;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	const { threshold = 0.15, delay = 0, rootMargin = '0px 0px -60px 0px' } = options;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					if (delay > 0) {
						setTimeout(() => node.classList.add('revealed'), delay);
					} else {
						node.classList.add('revealed');
					}
					observer.unobserve(node);
				}
			});
		},
		{ threshold, rootMargin }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}

/**
 * Parallax effect — moves element at different scroll speed
 * Usage: <div use:parallax> or <div use:parallax={{ speed: 0.3 }}>
 */
interface ParallaxOptions {
	speed?: number;
}

export function parallax(node: HTMLElement, options: ParallaxOptions = {}) {
	const { speed = 0.3 } = options;

	function handleScroll() {
		const rect = node.getBoundingClientRect();
		const scrolled = window.scrollY;
		const offset = (scrolled - node.offsetTop + window.innerHeight) * speed;
		node.style.transform = `translateY(${offset}px)`;
	}

	window.addEventListener('scroll', handleScroll, { passive: true });
	handleScroll();

	return {
		destroy() {
			window.removeEventListener('scroll', handleScroll);
			node.style.transform = '';
		}
	};
}

/**
 * Counter animation — animates number from 0 to target
 */
export function animateCounter(
	node: HTMLElement,
	options: { target: number; duration?: number; suffix?: string; prefix?: string }
) {
	const { target, duration = 2000, suffix = '', prefix = '' } = options;
	let started = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !started) {
					started = true;
					const startTime = performance.now();

					function update(currentTime: number) {
						const elapsed = currentTime - startTime;
						const progress = Math.min(elapsed / duration, 1);
						const eased = 1 - Math.pow(1 - progress, 3);
						const current = Math.round(target * eased);

						node.textContent = `${prefix}${current}${suffix}`;

						if (progress < 1) {
							requestAnimationFrame(update);
						} else {
							node.textContent = `${prefix}${target}${suffix}`;
						}
					}

					requestAnimationFrame(update);
					observer.unobserve(node);
				}
			});
		},
		{ threshold: 0.5 }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}
