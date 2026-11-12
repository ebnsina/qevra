<script lang="ts">
	// The frame of the signed-in areas: sinaui's Studio block with this academy's logo and sign-out.
	// Shared by the admin and the student portal.
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Studio from '#lib/sinaui/blocks/studio/Studio.svelte';
	import type { SidebarGroup } from '#lib/sinaui/ui/SidebarLayout.svelte';

	interface Props {
		/** Names the area ("Admin"); also the first breadcrumb. */
		label: string;
		/** The area's first page. */
		home: string;
		groups: SidebarGroup[];
		site: { name: string; logo_key: string };
		user: { name: string; email: string };
		/** Extra items in the account menu (a link to the other area). */
		menu?: Snippet;
		children: Snippet;
	}
	let { label, home, groups, site, user, menu, children }: Props = $props();

	let signOut = $state<HTMLFormElement>();
</script>

<div class="app-area">
	<Studio name={label} {home} {groups} path={page.url.pathname} {user} {menu} onsignout={() => signOut?.requestSubmit()}>
		{#snippet brand(collapsed)}
			{#if site.logo_key && !collapsed}
				<img class="logo" src="/files/{site.logo_key}" alt={site.name} />
			{:else}
				<span class="mark" aria-hidden="true">{site.name.slice(0, 1)}</span>
				{#if !collapsed}<strong>{site.name}</strong>{/if}
			{/if}
		{/snippet}
		{@render children()}
	</Studio>
	<form method="post" action="/logout" bind:this={signOut} hidden></form>
</div>

<style>
	.logo {
		height: 2.25rem;
		width: auto;
	}
	/* Same single-color-logo assumption as the website's Logo component. */
	:global(:root[data-theme='dark']) .logo {
		filter: invert(1);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .logo {
			filter: invert(1);
		}
	}
	.mark {
		display: grid;
		flex: none;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: calc(var(--ui-radius) * 0.75);
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-weight: 600;
	}
</style>
