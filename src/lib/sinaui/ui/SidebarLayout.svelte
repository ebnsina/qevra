<script lang="ts" module>
	import type { Home01Icon } from '@hugeicons/core-free-icons';

	export interface SidebarItem {
		label: string;
		/** With children, it only identifies the item: choosing it opens them instead. */
		href: string;
		/** Needed at the top level, where the collapsed rail shows only icons. */
		icon?: typeof Home01Icon;
		/** A count beside the name, such as items waiting; hidden at 0. A word ("Soon") shows muted. */
		badge?: number | string;
		/** Shown but not a link yet, such as a section that's coming: muted and skipped by Tab. */
		disabled?: boolean;
		/** Pages under this one, in an indented list it opens and closes; open while one is current. */
		children?: SidebarItem[];
	}
	export interface SidebarGroup {
		title?: string;
		items: SidebarItem[];
	}
</script>

<script lang="ts">
	import { ease, reduced } from './motion';
	import { onMount, tick, type Snippet } from 'svelte';
	import { ArrowDown01Icon, Menu01Icon, SidebarLeftIcon } from '@hugeicons/core-free-icons';
	import Breadcrumb from './Breadcrumb.svelte';
	import Dialog from './Dialog.svelte';
	import Icon from './Icon.svelte';
	import Popover from './Popover.svelte';
	import Tooltip from './Tooltip.svelte';
	import { glide } from './glide';
	import { scrollEdges } from './scroll-edges';
	import { load, save } from './stored';

	interface Props {
		/** Names the navigation ("Library"). */
		label: string;
		groups: SidebarGroup[];
		/** href of the page being shown. */
		current?: string;
		collapsed?: boolean;
		/** Remember collapsed/expanded in this browser under this key. */
		persist?: string;
		/** Called when an item is chosen (links still navigate). */
		onselect?: (item: SidebarItem) => void;
		/** Top of the sidebar; given whether it's collapsed, to show a compact mark in the rail. */
		header?: Snippet<[boolean]>;
		footer?: Snippet;
		/** A bar above the page on every screen size; the collapse button moves into it. */
		topbar?: Snippet;
		/** Where the page sits, shown in the top bar; the last one is the current page. */
		crumbs?: { label: string; href?: string }[];
		/** The page sits in a rounded panel inset from the window; the sidebar shares the window's tint. */
		inset?: boolean;
		/**
		 * On phones, these pages (up to four) become a bottom tab bar like a mobile app's, with a last
		 * tab that opens the full navigation; the menu button in the top bar goes away.
		 */
		tabs?: SidebarItem[];
		/** The last tab's name; translate it for non-English UIs. */
		moreLabel?: string;
		children: Snippet;
	}

	let {
		label,
		groups,
		current,
		collapsed = $bindable(false),
		persist,
		onselect,
		header,
		footer,
		topbar,
		crumbs,
		inset = false,
		tabs,
		moreLabel = 'More',
		children
	}: Props = $props();

	const top = $derived(!!topbar || !!crumbs?.length);

	const id = $props.id();
	let nav = $state<HTMLElement>();
	let main: HTMLElement;
	let hoverPill = $state<HTMLSpanElement>();
	let currentPill = $state<HTMLSpanElement>();
	let drawer = $state(false);
	let settled = false;
	// Opened or closed by hand, by href; otherwise a parent is open while one of its pages is current.
	let opened = $state<Record<string, boolean>>({});
	// The rail's open flyout, by its parent's href.
	let flyout = $state<string>();

	const holds = (item: SidebarItem): boolean =>
		!!item.children?.some((c) => c.href === current || holds(c));
	const isOpen = (item: SidebarItem) => opened[item.href] ?? holds(item);

	onMount(() => {
		if (persist) collapsed = load(persist, false);
	});

	/**
	 * Collapses or expands with transforms only: the layout changes in one step, then the content is
	 * slid from where it was to where it now is (FLIP). Animating the width would reflow every frame.
	 */
	async function toggle() {
		const before = main.getBoundingClientRect().left;
		collapsed = !collapsed;
		if (persist) save(persist, collapsed);
		await tick();
		const shift = before - main.getBoundingClientRect().left;
		if (shift && !reduced())
			main.animate([{ transform: `translateX(${shift}px)` }, { transform: 'none' }], {
				duration: 240,
				easing: ease.standard
			});
	}

	// The current page's pill glides when the page changes or the sidebar resizes; it snaps the first time.
	$effect(() => {
		void [current, collapsed, JSON.stringify(opened)];
		if (!nav || !currentPill) return;
		// The current page, or its parent while the page is folded away (or in the rail's flyout).
		const marked = [...nav.querySelectorAll<HTMLElement>('.item[aria-current]')].filter(
			(el) => el.checkVisibility() && !el.closest('.flyout')
		);
		const link = marked.find((el) => el.ariaCurrent === 'page') ?? marked[0];
		requestAnimationFrame(() => {
			if (currentPill) glide(currentPill, link, settled, 180);
			settled = true;
		});
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key.toLowerCase() === 'b' && (e.metaKey || e.ctrlKey) && !e.altKey) {
			e.preventDefault();
			toggle();
		}
	}}
/>

{#snippet name(item: SidebarItem)}
	{#if item.icon}<Icon icon={item.icon} size={18} />{/if}
	<span class="text">{item.label}</span>
	{#if item.badge}<span class={['badge', typeof item.badge === 'string' && 'word']}
			>{item.badge}</span
		>{/if}
{/snippet}

{#snippet link(item: SidebarItem, extra: object = {})}
	{#if item.disabled}
		<span class="item disabled" aria-disabled="true" {...extra}>
			{@render name(item)}
		</span>
	{:else}
		<a
			href={item.href}
			class="item"
			aria-current={item.href === current ? 'page' : undefined}
			{...extra}
			onclick={() => {
				drawer = false;
				flyout = undefined;
				onselect?.(item);
			}}
		>
			{@render name(item)}
		</a>
	{/if}
{/snippet}

{#snippet entries(items: SidebarItem[], asRail: boolean, key: string)}
	{#each items as item, i (item.href)}
		<li>
			{#if item.children && asRail}
				<!-- Icons only: a parent opens its pages in a flyout beside the rail. -->
				<Popover
					title={item.label}
					side="right"
					class="flyout"
					bind:open={() => flyout === item.href, (v) => (flyout = v ? item.href : undefined)}
				>
					{#snippet trigger(props)}
						<button
							type="button"
							class="item"
							aria-label={item.label}
							aria-current={holds(item) ? 'true' : undefined}
							{...props}
						>
							{#if item.icon}<Icon icon={item.icon} size={18} />{/if}
						</button>
					{/snippet}
					<ul class="sub">{@render entries(item.children, false, `${key}-${i}`)}</ul>
				</Popover>
			{:else if item.children}
				<button
					type="button"
					class="item"
					aria-expanded={isOpen(item)}
					aria-controls="{key}-{i}"
					aria-current={holds(item) && !isOpen(item) ? 'true' : undefined}
					onclick={() => (opened[item.href] = !isOpen(item))}
				>
					{#if item.icon}<Icon icon={item.icon} size={18} />{/if}
					<span class="text">{item.label}</span>
					<span class={['chev', isOpen(item) && 'open']}
						><Icon icon={ArrowDown01Icon} size={16} /></span
					>
				</button>
				<ul id="{key}-{i}" class="sub" hidden={!isOpen(item)}>
					{@render entries(item.children, false, `${key}-${i}`)}
				</ul>
			{:else if asRail}
				<!-- Icons only: the tooltip shows the name and is the link's name for screen readers. -->
				<Tooltip text={item.label} labels side="right">
					{#snippet trigger(props)}{@render link(item, props)}{/snippet}
				</Tooltip>
			{:else}
				{@render link(item)}
			{/if}
		</li>
	{/each}
{/snippet}

{#snippet fold(extra: object = {})}
	<button
		type="button"
		class="fold"
		aria-expanded={!collapsed}
		aria-controls="{id}-content"
		aria-keyshortcuts="Control+B Meta+B"
		{...extra}
		onclick={toggle}
	>
		<Icon icon={SidebarLeftIcon} size={18} />
	</button>
{/snippet}

{#snippet list(asRail: boolean, where: string)}
	{#each groups as group, g (g)}
		{#if group.title}<p class="group">{group.title}</p>{/if}
		<ul>{@render entries(group.items, asRail, `${id}-${where}${g}`)}</ul>
	{/each}
{/snippet}

<!-- The outer box is the container its own width is measured by; the grid sits inside it. -->
<div class="shell">
	<div class={['app', collapsed && 'collapsed', inset && 'inset', tabs?.length && 'tabbed']}>
		<aside class="sidebar" aria-label={label}>
			{#if header}<div class="head">{@render header(collapsed)}</div>{/if}
			<nav
				bind:this={nav}
				{@attach scrollEdges}
				data-fade
				aria-label={label}
				onpointerover={(e) => {
					if (e.pointerType === 'touch' || !hoverPill) return;
					// The current page already has its own fill, and a disabled item can't be chosen.
					const a = (e.target as Element).closest<HTMLElement>('.item:not(.flyout *)');
					const still = a?.hasAttribute('aria-current') || a?.ariaDisabled === 'true';
					glide(hoverPill, still ? null : a, true);
				}}
				onpointerleave={() => hoverPill && glide(hoverPill, null, false)}
			>
				<span class="pill current" aria-hidden="true" bind:this={currentPill}></span>
				<span class="pill hover" aria-hidden="true" bind:this={hoverPill}></span>
				{@render list(collapsed, 'n')}
			</nav>
			<div class="foot">
				{@render footer?.()}
				{#if !top}
					<Tooltip text="{collapsed ? 'Expand' : 'Collapse'} sidebar" labels side="right">
						{#snippet trigger(props)}{@render fold(props)}{/snippet}
					</Tooltip>
				{/if}
			</div>
		</aside>

		<div bind:this={main} id="{id}-content" class="main" {@attach scrollEdges} data-fade>
			<!-- Phones: the same navigation, one tap away. With a topbar, it shows on every screen. -->
			<div
				class={['bar', top && 'top']}
				role={top ? undefined : 'navigation'}
				aria-label={top ? undefined : label}
			>
				<button
					type="button"
					class="menu"
					aria-label="Open {label}"
					onclick={() => (drawer = true)}
				>
					<Icon icon={Menu01Icon} size={20} />
				</button>
				{#if top}
					<Tooltip text="{collapsed ? 'Expand' : 'Collapse'} sidebar" labels side="bottom">
						{#snippet trigger(props)}{@render fold(props)}{/snippet}
					</Tooltip>
				{/if}
				{#if header}<div class="bar-head">{@render header(false)}</div>{/if}
				{#if crumbs?.length}<div class="crumbs">
						<Breadcrumb items={crumbs} label="{label}: where you are" />
					</div>{/if}
				{#if topbar}<div class="bar-top">{@render topbar()}</div>{/if}
			</div>
			{@render children()}
		</div>

		{#if tabs?.length}
			<!-- Phones: the main pages one thumb-reach away, as in a mobile app. -->
			<nav class="tabs" aria-label="{label}: main pages">
				{#each tabs.slice(0, 4) as item (item.href)}
					<a
						href={item.href}
						class="tab"
						aria-current={item.href === current ? 'page' : undefined}
						onclick={() => onselect?.(item)}
					>
						<span class="tab-icon">
							{#if item.icon}<Icon icon={item.icon} size={22} />{/if}
							{#if item.badge}<span class="tab-badge">{item.badge}</span>{/if}
						</span>
						<span class="tab-text">{item.label}</span>
					</a>
				{/each}
				<button type="button" class="tab" aria-haspopup="dialog" onclick={() => (drawer = true)}>
					<span class="tab-icon"><Icon icon={Menu01Icon} size={22} /></span>
					<span class="tab-text">{moreLabel}</span>
				</button>
			</nav>
		{/if}
	</div>
</div>

<!-- Narrow screens: the same navigation in a sheet from the start edge. -->
<Dialog bind:open={drawer} side="start" title={label}>
	<nav class="sheet-nav" aria-label={label}>{@render list(false, 's')}</nav>
	<!-- The sidebar's footer too (a folder tree, storage), so nothing is desktop-only. -->
	{#if footer}<div class="sheet-foot">{@render footer()}</div>{/if}
</Dialog>

<style>
	.shell {
		container-type: inline-size;
		block-size: 100%;
	}
	.app {
		display: grid;
		grid-template-columns: var(--ui-sidebar-w) minmax(0, 1fr);
		block-size: 100%;
		min-block-size: 0;
		color: var(--ui-fg);
		font: var(--ui-sidebar-font)/1.4 var(--ui-font);
	}
	.app.collapsed {
		grid-template-columns: 3.5rem minmax(0, 1fr);
	}
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-inline-size: 0;
		padding: 0.5rem 0.75rem 0.75rem;
		overflow: hidden;
		border-inline-end: 1px solid var(--ui-sidebar-line);
		background: var(--ui-sidebar-bg);
	}
	.head {
		display: grid;
		align-content: center;
		min-block-size: 2.125rem;
		/* Room for a field's focus ring inside the clip, given back by the margin. */
		box-sizing: content-box;
		margin-block: -0.25rem;
		padding: 0.25rem 0.4375rem;
		overflow: hidden;
		white-space: nowrap;
	}
	/* Scrolls when it must, fading at the edges so it's plainly scrollable. */
	nav {
		position: relative;
		flex: 1;
		min-block-size: 0;
		overflow: auto;
		scrollbar-width: none;
	}
	/* Reaches the sidebar's edge, so the current page's bar can sit there without being clipped. */
	.sidebar > nav {
		margin-inline: -0.75rem;
		padding-inline: 0.75rem;
	}
	.group {
		margin: 1rem 0 0.25rem;
		padding-inline: 0.4375rem;
		overflow: hidden;
		color: var(--ui-muted);
		font-size: var(--ui-sidebar-title-font);
		font-weight: 500;
		text-transform: var(--ui-sidebar-title-case);
		letter-spacing: var(--ui-sidebar-title-tracking);
		white-space: nowrap;
		transition: opacity 150ms ease;
	}
	/* minmax(0, 1fr): the column may shrink to the rail; auto would grow to the hidden labels. */
	ul {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	/* A group without a title still stands apart from the one above. */
	ul + ul {
		margin-block-start: 1rem;
	}
	.item,
	.fold {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		box-sizing: border-box;
		inline-size: 100%;
		min-block-size: var(--ui-sidebar-item-h);
		margin: 0;
		padding: 0 0.4375rem;
		border: 0;
		border-radius: var(--ui-radius-control);
		background: none;
		color: var(--ui-muted);
		font: inherit;
		font-weight: 400;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition: color var(--ui-dur) ease;
	}
	/* Icon only; the tooltip names it. */
	.fold {
		justify-content: center;
		inline-size: var(--ui-sidebar-item-h);
		padding: 0;
	}
	.item :global(svg),
	.fold :global(svg) {
		flex: none;
	}
	.item:hover,
	.fold:hover {
		color: var(--ui-fg);
	}
	.item.disabled {
		color: var(--ui-muted);
		opacity: 0.6;
		cursor: default;
	}
	.item[aria-current] {
		color: var(--ui-sidebar-current-fg);
		font-weight: 500;
	}
	.item:focus-visible,
	.fold:focus-visible,
	.menu:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: -2px;
	}
	/* Labels fade out as it collapses; the icons stay put. */
	/* min-inline-size: 0 lets a long name shrink and truncate; a flex item won't by default. */
	.text {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: opacity 150ms ease;
	}
	/* Sub-pages line up under their parent's name: icon (18px) plus the gap (0.625rem). */
	.sub {
		margin-block-start: 0.25rem;
		padding-inline-start: calc(18px + 0.625rem);
	}
	.sub[hidden] {
		display: none;
	}
	:global(.flyout) .sub {
		margin: 0;
		padding: 0;
	}
	.chev {
		display: flex;
		margin-inline-start: auto;
		transition: rotate var(--ui-dur) var(--ui-ease-out);
	}
	.chev.open {
		rotate: 180deg;
	}
	.badge {
		margin-inline-start: auto;
		padding: 0 0.4375rem;
		border-radius: 999px;
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-size: 0.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1.25rem;
	}
	.badge.word {
		background: var(--ui-subtle);
		color: var(--ui-muted);
		font-weight: 500;
	}
	/* Not in the rail's flyout, which sits inside the collapsed sidebar but shows names. */
	.collapsed .text:not(:global(.flyout *)),
	.collapsed .badge:not(:global(.flyout *)),
	.collapsed .group {
		opacity: 0;
	}
	.collapsed .group {
		block-size: 0.5rem;
		margin: 0.5rem 0;
	}
	/* Two pills glide between items: the current page's (tinted), and the pointer's. */
	.pill {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		border-radius: var(--ui-radius-control);
		opacity: 0;
		pointer-events: none;
		transition: opacity 120ms ease;
	}
	.pill.current,
	.sheet-nav .item[aria-current='page'] {
		background: var(--ui-sidebar-current-bg);
	}
	/* A short ink bar on the sidebar's outer edge, rounded toward the link (as in the docs). */
	.pill.current::before,
	.sheet-nav .item[aria-current='page']::before {
		content: '';
		position: absolute;
		inset-block: 0.5rem;
		inset-inline-start: -0.75rem;
		inline-size: 3px;
		border-start-end-radius: 4px;
		border-end-end-radius: 4px;
		background: var(--ui-accent);
	}
	@media (forced-colors: active) {
		.pill.current::before,
		.sheet-nav .item[aria-current='page']::before {
			forced-color-adjust: none;
			background: Highlight;
		}
	}
	.pill.hover {
		background: var(--ui-hover);
	}
	.foot {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.25rem;
	}
	.main {
		min-inline-size: 0;
		overflow: auto;
	}
	/* Pinned while the content scrolls, so the menu is always one tap away. */
	.bar {
		position: sticky;
		inset-block-start: 0;
		z-index: 4;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-block-size: 3.125rem;
		box-sizing: border-box;
		padding: 0.25rem 0.75rem;
		border-block-end: 1px solid var(--ui-sidebar-line);
		background: color-mix(in srgb, var(--ui-bg) 92%, transparent);
		backdrop-filter: blur(12px);
	}
	.bar:not(.top),
	.menu,
	.bar-head {
		display: none;
	}
	.bar .fold {
		inline-size: 2rem;
		min-block-size: 2rem;
		margin-inline-start: -0.4375rem;
		padding: 0;
		justify-content: center;
	}
	.crumbs {
		flex: 1;
		min-inline-size: 0;
		container-type: inline-size;
	}
	/* The bar is one line: the trail never wraps, and a narrow bar keeps only the current page. */
	.crumbs :global(ol) {
		flex-wrap: nowrap;
	}
	@container (max-inline-size: 20rem) {
		.crumbs :global(li:not(:last-child)),
		.crumbs :global(li:last-child .sep) {
			display: none;
		}
	}
	.crumbs + .bar-top {
		flex: none;
	}
	@media (pointer: coarse) {
		.bar .fold {
			inline-size: 2.75rem;
			min-block-size: 2.75rem;
			margin-inline-start: -0.5rem;
		}
	}
	.bar-top {
		flex: 1;
		min-inline-size: 0;
	}
	.menu {
		place-items: center;
		inline-size: 2.75rem;
		block-size: 2.75rem;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: var(--ui-radius);
		background: none;
		color: var(--ui-fg);
		cursor: pointer;
	}
	.bar .bar-head {
		min-inline-size: 0;
		font-weight: 600;
	}
	.sheet-foot {
		display: grid;
		gap: 1rem;
		margin-block-start: 1rem;
	}
	.sheet-nav ul {
		margin-block-end: 0.5rem;
	}
	/* Narrow: no sidebar; a menu button opens the same links in a sheet. */
	/* Inset: one tint behind everything, the page on its own panel. */
	.inset {
		--gap: 0.25rem;
		background: var(--ui-sidebar-inset-bg);
	}
	.inset .sidebar {
		padding-block-start: var(--gap);
		border-inline-end: 0;
		background: none;
	}
	/* Same height and offset as the page's top bar, so the brand lines up with the breadcrumb. */
	.inset .head {
		min-block-size: 3.125rem;
	}
	.inset .main {
		margin: var(--gap) var(--gap) var(--gap) 0;
		border-radius: var(--ui-radius);
		background: var(--ui-bg);
		box-shadow: 0 0 0 1px var(--ui-line);
	}
	.inset .bar {
		border-start-start-radius: var(--ui-radius);
		border-start-end-radius: var(--ui-radius);
	}
	.tabs {
		display: none;
	}
	.tab {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 0.125rem;
		min-inline-size: 0;
		min-block-size: 3.5rem;
		padding: 0.375rem 0.25rem;
		border: 0;
		background: none;
		color: var(--ui-muted);
		font: 500 0.6875rem/1.2 var(--ui-font);
		text-decoration: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.tab[aria-current='page'] {
		color: var(--ui-fg);
		font-weight: 600;
	}
	.tab:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: calc(-1 * var(--ui-ring-width));
		border-radius: var(--ui-radius-control);
	}
	.tab-icon {
		position: relative;
		display: grid;
		place-items: center;
		inline-size: 3.25rem;
		block-size: 1.75rem;
		border-radius: 999px;
		transition: background var(--ui-dur) var(--ui-ease-out);
	}
	.tab[aria-current='page'] .tab-icon {
		background: var(--ui-sidebar-current-bg);
		color: var(--ui-sidebar-current-fg);
	}
	.tab-badge {
		position: absolute;
		inset-block-start: -0.125rem;
		inset-inline-end: 0.375rem;
		min-inline-size: 1rem;
		padding-inline: 0.25rem;
		border-radius: 999px;
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-size: 0.625rem;
		font-weight: 600;
		line-height: 1rem;
		text-align: center;
	}
	.tab-text {
		max-inline-size: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@container (max-width: 40rem) {
		.app.tabbed {
			grid-template-rows: minmax(0, 1fr) auto;
		}
		.tabs {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: minmax(0, 1fr);
			/* Clear of the home indicator once installed as an app. */
			padding-block-end: env(safe-area-inset-bottom);
			border-block-start: 1px solid var(--ui-sidebar-line);
			background: var(--ui-surface);
		}
		.tabbed .bar .menu {
			display: none;
		}
		.tabbed .bar {
			padding-inline-start: 0.75rem;
		}
		.inset .main {
			margin: 0;
			border-radius: 0;
			box-shadow: none;
		}
		.app,
		.app.collapsed {
			grid-template-columns: minmax(0, 1fr);
		}
		.sidebar,
		.bar .fold {
			display: none;
		}
		.bar:not(.top) {
			display: flex;
		}
		.bar {
			min-block-size: 3.25rem;
			padding-inline: 0.25rem 0.75rem;
		}
		.menu {
			display: grid;
		}
		.bar-head {
			display: block;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.text,
		.group,
		.chev,
		.tab-icon {
			transition: none;
		}
	}
</style>
