<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Names the toolbar ("Formatting"). */
		label: string;
		orientation?: 'horizontal' | 'vertical';
		children: Snippet;
		class?: string;
	}

	let { label, orientation = 'horizontal', children, class: className }: Props = $props();

	// One tab stop for the whole bar; arrow keys move between its controls (roving tabindex).
	const controls = (bar: HTMLElement) =>
		[...bar.querySelectorAll<HTMLElement>('button, [role="radio"], input, a[href]')].filter(
			(el) => !el.hasAttribute('disabled') && !el.closest('[popover]')
		);
	let current = 0;

	function rove(bar: HTMLElement) {
		const sync = () => {
			const list = controls(bar);
			current = Math.min(current, list.length - 1);
			list.forEach((el, i) => (el.tabIndex = i === current ? 0 : -1));
		};
		sync();
		const seen = new MutationObserver(sync);
		seen.observe(bar, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['disabled']
		});
		return () => seen.disconnect();
	}

	function keys(e: KeyboardEvent) {
		const bar = e.currentTarget as HTMLElement;
		const list = controls(bar);
		const i = list.indexOf(document.activeElement as HTMLElement);
		if (i < 0) return;
		const rtl = getComputedStyle(bar).direction === 'rtl';
		const [back, forward] =
			orientation === 'vertical'
				? ['ArrowUp', 'ArrowDown']
				: rtl
					? ['ArrowRight', 'ArrowLeft']
					: ['ArrowLeft', 'ArrowRight'];
		const next =
			e.key === forward
				? (i + 1) % list.length
				: e.key === back
					? (i - 1 + list.length) % list.length
					: e.key === 'Home'
						? 0
						: e.key === 'End'
							? list.length - 1
							: -1;
		if (next < 0) return;
		e.preventDefault();
		list[i].tabIndex = -1;
		list[next].tabIndex = 0;
		list[next].focus();
		current = next;
	}
</script>

<div
	class={['toolbar', orientation, className]}
	role="toolbar"
	aria-label={label}
	aria-orientation={orientation}
	tabindex="-1"
	{@attach rove}
	onkeydown={keys}
	onfocusin={(e) => {
		const i = controls(e.currentTarget).indexOf(e.target as HTMLElement);
		if (i >= 0) current = i;
	}}
>
	{@render children()}
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		box-sizing: border-box;
		min-block-size: var(--ui-control-h);
		padding: 0.25rem 0.375rem;
		border-radius: calc(var(--ui-radius-control) + 0.125rem);
		background: var(--ui-faint);
	}
	.toolbar:focus {
		outline: none;
	}
	.vertical {
		flex-direction: column;
		align-items: stretch;
		inline-size: max-content;
	}
	/* A divider between groups: <span role="separator"></span> inside. */
	.toolbar :global([role='separator']) {
		align-self: stretch;
		inline-size: 1px;
		margin: 0.25rem 0.125rem;
		background: var(--ui-line);
	}
	.vertical :global([role='separator']) {
		inline-size: auto;
		block-size: 1px;
		margin: 0.125rem 0.25rem;
	}
</style>
