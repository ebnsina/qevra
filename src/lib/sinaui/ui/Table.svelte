<script lang="ts">
	import type { Snippet } from 'svelte';
	import { scrollEdges } from './scroll-edges';

	interface Props {
		/** Says what the table holds; shown above it and read as its name. */
		caption: string;
		/** Keep the caption for screen readers only, when a heading above already says it. */
		hideCaption?: boolean;
		/** Your <thead>, <tbody> and <tfoot>. Mark number cells class="num" to right-align them. */
		children: Snippet;
		/** Tint every other row too. Rows are always split by hairlines and light up under the pointer. */
		striped?: boolean;
		class?: string;
	}

	let {
		caption,
		hideCaption = false,
		children,
		striped = false,
		class: className
	}: Props = $props();
	const id = $props.id();
</script>

<!-- Scrolls sideways on narrow screens; focusable so keyboard users can scroll it too. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={['frame', striped && 'striped', className]}
	role="region"
	aria-labelledby="{id}-caption"
	tabindex="0"
	{@attach scrollEdges}
	data-fade="x"
>
	<table>
		<caption id="{id}-caption" class={{ 'sr-only': hideCaption }}>{caption}</caption>
		{@render children()}
	</table>
</div>

<style>
	.frame {
		overflow-x: auto;
		min-inline-size: 0;
		border-radius: var(--ui-radius);
		color: var(--ui-fg);
		font: var(--ui-font-size)/1.5 var(--ui-font);
	}
	.frame:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	table {
		inline-size: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}
	caption {
		padding-block-end: 0.5rem;
		font-weight: 600;
		text-align: start;
	}
	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	/* 40px rows split by hairlines. */
	.frame :global(:is(th, td)) {
		block-size: 2.5rem;
		box-sizing: border-box;
		padding: 0.5rem 0.75rem;
		border-block-end: 1px solid var(--ui-line);
		text-align: start;
		vertical-align: middle;
	}
	.frame :global(tbody tr:last-child > *) {
		border-block-end: 0;
	}
	.frame :global(thead th) {
		color: var(--ui-muted);
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
	}
	/* A row's own name (scope="row") reads as the start of the row, not as a column heading. */
	.frame :global(tbody th) {
		font-weight: 500;
		white-space: nowrap;
	}
	.frame :global(.num) {
		text-align: end;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	/* The row under the pointer is easier to follow across. */
	.frame.striped :global(tbody tr:nth-child(odd) > *) {
		background: var(--ui-subtle);
	}
	.frame :global(tbody tr > *) {
		transition: background-color var(--ui-dur-press) ease;
	}
	@media (hover: hover) and (pointer: fine) {
		.frame :global(tbody tr:hover > *) {
			background: var(--ui-hover);
		}
	}
	/* Totals: set apart by weight and the rule above them. */
	.frame :global(tfoot :is(th, td)) {
		border-block: 1px solid var(--ui-line);
		border-block-end: 0;
		font-weight: 600;
	}
</style>
