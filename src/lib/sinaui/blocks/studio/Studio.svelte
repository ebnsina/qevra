<script lang="ts">
	// The frame of a signed-in app (an admin, a portal, a dashboard): a searchable grouped sidebar,
	// breadcrumbs, a top bar with the account menu, and on phones a bottom tab bar like a mobile app's.
	import type { Snippet } from 'svelte';
	import AccountMenu from '../../ui/AccountMenu.svelte';
	import SearchField from '../../ui/SearchField.svelte';
	import SidebarLayout, { type SidebarGroup, type SidebarItem } from '../../ui/SidebarLayout.svelte';

	interface Props {
		/** The app or organization: names the navigation and is the first breadcrumb. */
		name: string;
		/** The app's first page; the first breadcrumb and the brand link go there. */
		home: string;
		groups: SidebarGroup[];
		/** The address being shown (`page.url.pathname` in SvelteKit); decides the current item. */
		path: string;
		/** The signed-in person, for the account menu. */
		user: { name: string; email?: string; image?: string };
		/** Runs when "Sign out" is chosen; the item shows only when given. */
		onsignout?: () => void;
		/** Called when a navigation item is chosen (links still navigate). */
		onselect?: (item: SidebarItem) => void;
		/** Your logo, in place of the letter mark and name; given whether the sidebar is collapsed. */
		brand?: Snippet<[boolean]>;
		/** In the top bar before the account menu: a search button, a switcher, a status. */
		tools?: Snippet;
		/** Your own items in the account menu (settings, a link to the website). */
		menu?: Snippet;
		/**
		 * The pages in the phone tab bar (up to four). Left unset, the first group's pages are used;
		 * false keeps the menu button instead.
		 */
		tabs?: SidebarItem[] | false;
		/** A field above the navigation that narrows it as you type. */
		search?: boolean;
		/** The page sits in a rounded panel; the sidebar shares the window's tint. */
		inset?: boolean;
		/** How tall the frame is. It fills the window by default. */
		height?: string;
		/** Translate these for non-English UIs. */
		labels?: {
			search?: string;
			/** Shown when the search matches no page. */
			noMatch?: string;
			more?: string;
			account?: string;
			signOut?: string;
			darkTheme?: string;
			lightTheme?: string;
		};
		children: Snippet;
	}
	let {
		name,
		home,
		groups,
		path,
		user,
		onsignout,
		onselect,
		brand,
		tools,
		menu,
		tabs,
		search = true,
		inset = true,
		height = '100dvh',
		labels = {},
		children
	}: Props = $props();

	const t = $derived({
		search: 'Search the menu',
		noMatch: 'No page matches.',
		more: 'More',
		...labels
	});

	let query = $state('');
	// Every page, children included: the search and the current page look through all of them.
	const flat = (items: SidebarItem[]): SidebarItem[] =>
		items.flatMap((i) => [i, ...flat(i.children ?? [])]);
	const all = $derived(flat(groups.flatMap((g) => g.items)));
	const shown = $derived.by(() => {
		const q = query.trim().toLocaleLowerCase();
		if (!q) return groups;
		const matches = (i: SidebarItem) => i.label.toLocaleLowerCase().includes(q);
		return groups
			.map((g) => ({
				...g,
				items: g.items.filter((i) => matches(i) || (i.children ?? []).some(matches))
			}))
			.filter((g) => g.items.length);
	});
	// The current page is the deepest item whose address starts the path.
	const current = $derived(
		[...all]
			.sort((a, b) => b.href.length - a.href.length)
			.find((i) => path === i.href || path.startsWith(`${i.href}/`))
	);
	const crumbs = $derived([
		{ label: name, href: home },
		...(current && current.href !== home ? [{ label: current.label }] : [])
	]);
	const phoneTabs = $derived(tabs === false ? undefined : (tabs ?? groups[0]?.items));
</script>

<div class="studio" style:block-size={height}>
	<SidebarLayout
		label={name}
		groups={shown}
		current={current?.href}
		{crumbs}
		{inset}
		{onselect}
		tabs={phoneTabs}
		moreLabel={t.more}
		persist="{home}-sidebar"
	>
		{#snippet header(collapsed)}
			<div class="head">
				<a class="brand" href={home} aria-label={name}>
					{#if brand}
						{@render brand(collapsed)}
					{:else}
						<span class="mark" aria-hidden="true">{name.slice(0, 1)}</span>
						{#if !collapsed}<strong>{name}</strong>{/if}
					{/if}
				</a>
				{#if search && !collapsed}
					<div class="search">
						<SearchField label={t.search} hideLabel placeholder={t.search} bind:value={query} />
						{#if !shown.length}<p class="none" role="status">{t.noMatch}</p>{/if}
					</div>
				{/if}
			</div>
		{/snippet}
		{#snippet topbar()}
			<div class="bar">
				{@render tools?.()}
				<AccountMenu {user} theme {onsignout} {labels}>
					{@render menu?.()}
				</AccountMenu>
			</div>
		{/snippet}
		{@render children()}
	</SidebarLayout>
</div>

<style>
	.head {
		display: grid;
		gap: 0.75rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		color: inherit;
		text-decoration: none;
	}
	.mark {
		display: grid;
		flex: none;
		place-items: center;
		inline-size: 1.75rem;
		block-size: 1.75rem;
		border-radius: calc(var(--ui-radius) * 0.75);
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-weight: 600;
	}
	.search {
		display: grid;
		gap: 0.5rem;
	}
	/* On a phone the brand also sits in the top bar; the menu search stays with the sidebar. */
	@container (max-width: 40rem) {
		.search {
			display: none;
		}
	}
	.none {
		margin: 0;
		color: var(--ui-muted);
		font-size: 0.8125rem;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
