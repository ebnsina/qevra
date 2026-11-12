<script lang="ts">
	import type { Home01Icon } from '@hugeicons/core-free-icons';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
		title?: string;
		description?: string;
		/** Beside the title, to tell sections apart at a glance (settings, reports). Decorative. */
		icon?: typeof Home01Icon;
		/** Heading level for the title, to fit the page's outline. */
		level?: 2 | 3 | 4;
		/** Makes the whole card a link; the title becomes the link text screen readers announce. */
		href?: string;
		/** Beside the title: a switch, a count, a link. */
		aside?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		/** The panel's content runs edge to edge (a table, a list of rows). */
		flush?: boolean;
		/** Chosen from a set of cards. */
		selected?: boolean;
		/** danger: a red edge and title, for actions that can't be undone (a "Danger zone"). */
		tone?: 'danger';
	}

	let {
		title,
		description,
		icon,
		level = 3,
		href,
		aside,
		children,
		footer,
		flush = false,
		selected = false,
		tone,
		class: className,
		...rest
	}: Props = $props();
</script>

<!-- A flat bordered panel: title, content and actions inside it.
     With href, the title's link stretches over the whole card, so screen readers hear one name. -->
<article
	class={[
		'card',
		href && 'linked',
		selected && 'selected',
		tone === 'danger' && 'danger',
		className
	]}
	{...rest}
>
	{#if title || aside}
		<div class="head">
			{#if title}
				<div class={['heading', icon && 'with-icon']}>
					{#if icon}<span class="icon"><Icon {icon} size={18} /></span>{/if}
					<svelte:element this={`h${level}`} class="title">
						{#if href}<a {href}>{title}</a>{:else}{title}{/if}
					</svelte:element>
					{#if description}<p class="description">{description}</p>{/if}
				</div>
			{/if}
			{@render aside?.()}
		</div>
	{/if}
	{#if children}<div class={['panel', flush && 'flush']}>{@render children()}</div>{/if}
	{#if footer}<div class="footer">{@render footer()}</div>{/if}
</article>

<style>
	.card {
		position: relative;
		box-sizing: border-box;
		/* a column, so a card stretched to its row's height keeps its footer on the bottom edge */
		display: flex;
		flex-direction: column;
		min-inline-size: 0;
		border: 1px solid var(--ui-card-line, var(--ui-field-line));
		border-radius: calc(var(--ui-radius) + 0.25rem);
		background: var(--ui-surface);
		box-shadow: var(--ui-card-shadow, none);
		color: var(--ui-fg);
		font: var(--ui-font-size)/1.5 var(--ui-font);
	}
	.danger {
		border-color: color-mix(in oklab, var(--ui-danger) 45%, var(--ui-field-line));
	}
	.danger .title {
		color: var(--ui-danger);
	}
	.selected {
		border-color: var(--ui-fg);
		box-shadow: inset 0 0 0 1px var(--ui-fg);
	}
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1rem 0;
	}
	/* A card that's only a header (a link card) keeps the same space below as at its sides. */
	.head:last-child {
		padding-block-end: 1rem;
	}
	.heading {
		min-inline-size: 0;
	}
	/* The icon sits on the title's line; the description lines up under the title, not the icon. */
	.with-icon {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		column-gap: 0.5rem;
	}
	.with-icon > :not(.icon) {
		grid-column: 2;
	}
	.icon {
		display: flex;
		align-items: center;
		block-size: calc(var(--ui-font-size) * 1.5);
		color: var(--ui-card-icon, var(--ui-muted));
	}
	.title {
		margin: 0;
		font-family: var(--ui-font-heading);
		font-size: var(--ui-font-size);
		font-weight: 500;
	}
	.title a {
		color: inherit;
		text-decoration: none;
	}
	/* The link's hit area covers the whole card. */
	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.linked:has(a:focus-visible) {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.title a:focus-visible {
		outline: none;
	}
	.linked {
		transition: border-color var(--ui-dur-press) ease;
	}
	@media (hover: hover) and (pointer: fine) {
		.linked:hover {
			border-color: color-mix(in srgb, var(--ui-fg) 22%, transparent);
		}
	}
	.description {
		margin: 0.125rem 0 0;
		color: var(--ui-muted);
	}
	.panel {
		display: grid;
		gap: 0.75rem;
		min-inline-size: 0;
		padding: 1rem;
	}
	.head + .panel,
	.head + .footer {
		padding-block-start: 0.75rem;
	}
	.head + .flush {
		padding-block-start: 0;
		margin-block-start: 1rem;
		border-block-start: 1px solid var(--ui-line);
		border-start-start-radius: 0;
		border-start-end-radius: 0;
	}
	.flush:has(+ .footer) {
		border-end-start-radius: 0;
		border-end-end-radius: 0;
	}
	.flush {
		gap: 0;
		overflow: hidden;
		padding: 0;
		border-radius: calc(var(--ui-radius) + 0.25rem - 1px);
	}
	/* Actions sit at the end, main action last; wrapping keeps it on the bottom row, like Dialog. */
	.footer {
		margin-block-start: auto;
		display: flex;
		flex-wrap: wrap-reverse;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0 1rem 1rem;
	}
	.flush + .footer {
		padding-block-start: 1rem;
		border-block-start: 1px solid var(--ui-line);
	}
	/* Controls inside a linked card stay clickable above the stretched link. */
	.linked :is(.panel, .footer) :global(:is(a, button, input, select, textarea, label)) {
		position: relative;
		z-index: 1;
	}
</style>
