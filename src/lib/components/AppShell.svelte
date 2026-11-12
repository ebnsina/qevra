<script lang="ts">
	// The frame of the signed-in areas: sinaui's Studio block, headed "Dashboard" with a badge that
	// says whose it is. Shared by the admin and the student portal.
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Studio from '#lib/sinaui/blocks/studio/Studio.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import type { SidebarGroup } from '#lib/sinaui/ui/SidebarLayout.svelte';

	interface Props {
		/** Names the area ("Admin"); also the first breadcrumb. */
		label: string;
		/** The badge beside "Dashboard": "Admin" or "Student". */
		role: string;
		/** The area's first page. */
		home: string;
		groups: SidebarGroup[];
		user: { name: string; email: string };
		/** Extra items in the account menu (a link to the other area). */
		menu?: Snippet;
		children: Snippet;
	}
	let { label, role, home, groups, user, menu, children }: Props = $props();

	let signOut = $state<HTMLFormElement>();
</script>

<div class="app-area">
	<Studio name={label} {home} {groups} path={page.url.pathname} {user} {menu} search={false} onsignout={() => signOut?.requestSubmit()}>
		{#snippet brand(collapsed)}
			{#if collapsed}
				<span class="mark" aria-hidden="true">{role.slice(0, 1)}</span>
			{:else}
				<strong class="title">Dashboard</strong>
				<Badge tone="accent" icon={false}>{role}</Badge>
			{/if}
		{/snippet}
		{@render children()}
	</Studio>
	<form method="post" action="/logout" bind:this={signOut} hidden></form>
</div>

<style>
	.title {
		font-size: 1.0625rem;
		font-weight: 600;
		letter-spacing: -0.01em;
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
