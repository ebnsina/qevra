<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLDetailsAttributes } from 'svelte/elements';
	import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
	import Icon from '../Icon.svelte';
	import { getAccordion } from './context';

	interface Props extends Omit<HTMLDetailsAttributes, 'name' | 'title'> {
		title: string;
		/** Short muted text beside the title: a count, a status ("8 rules · 7 on"). */
		description?: string;
		/** Controls at the end of the row, outside the toggle: a switch, a menu. */
		aside?: Snippet;
		open?: boolean;
		children: Snippet;
	}

	let {
		title,
		description,
		aside,
		open = $bindable(false),
		children,
		class: className,
		...rest
	}: Props = $props();
	const accordion = getAccordion();
	// The aside sits over the summary row, not in it: a control inside <summary> would toggle the item.
	let asideWidth = $state(0);
	let summaryHeight = $state(0);
</script>

<div class="wrap">
	<!-- Native <details>: expand/collapse, keyboard and screen-reader state come from the browser. -->
	<details class={['item', className]} name={accordion.name} bind:open {...rest}>
		<summary bind:clientHeight={summaryHeight}>
			<span class="label">
				<span>{title}</span>
				{#if description}<span class="description">{description}</span>{/if}
			</span>
			{#if aside}<span class="aside-space" style:inline-size="{asideWidth}px"></span>{/if}
			<span class="chev"><Icon icon={ArrowDown01Icon} size={16} /></span>
		</summary>
		<div class="content">{@render children()}</div>
	</details>
	{#if aside}
		<div class="aside" bind:clientWidth={asideWidth} style:block-size="{summaryHeight}px">
			{@render aside()}
		</div>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
	}
	.label {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.75rem;
		flex: 1;
		min-inline-size: 0;
	}
	.description {
		font-weight: 400;
		font-size: 0.875em;
		color: var(--ui-muted);
	}
	.aside-space {
		flex: none;
	}
	/* Right of the title, left of the chevron (16px icon plus the summary's 1rem gap). */
	.aside {
		position: absolute;
		inset-block-start: 0;
		inset-inline-end: calc(16px + 1rem);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	summary {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-block-size: 2.75rem;
		padding-block: 0.75rem;
		font-weight: 500;
		list-style: none;
		cursor: pointer;
		border-radius: calc(var(--ui-radius) / 2);
		-webkit-tap-highlight-color: transparent;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.chev {
		display: grid;
		flex: none;
		color: var(--ui-muted);
		transition: rotate var(--ui-dur) var(--ui-ease-out);
	}
	.item[open] > summary .chev {
		rotate: 180deg;
	}
	.content {
		padding-block-end: 1rem;
		color: var(--ui-muted);
	}

	/* Height animation where the browser supports animating to auto (Chromium today); instant elsewhere.
	   Accordions are the one place a height transition is acceptable: nothing else can express it. */
	@supports (interpolate-size: allow-keywords) {
		.item {
			interpolate-size: allow-keywords;
		}
		.item::details-content {
			block-size: 0;
			overflow: clip;
			opacity: 0;
			transition:
				block-size var(--ui-dur) var(--ui-ease-out),
				opacity var(--ui-dur) var(--ui-ease-out),
				content-visibility var(--ui-dur) allow-discrete;
		}
		.item[open]::details-content {
			block-size: auto;
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.chev,
		.item::details-content {
			transition: none;
		}
	}
</style>
