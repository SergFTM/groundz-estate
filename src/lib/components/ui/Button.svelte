<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'outline-light';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit';
		href?: string;
		disabled?: boolean;
		fullWidth?: boolean;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		href,
		disabled = false,
		fullWidth = false,
		children,
		onclick,
		...restProps
	}: Props = $props();

	let className = $derived(
		[
			'btn',
			`btn--${variant}`,
			size !== 'md' ? `btn--${size}` : '',
			fullWidth ? 'btn--full' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href && !disabled}
	<a href={href} class={className} {...restProps}>
		{@render children()}
	</a>
{:else}
	<button
		{type}
		class={className}
		{disabled}
		{onclick}
		{...restProps}
	>
		{@render children()}
	</button>
{/if}
