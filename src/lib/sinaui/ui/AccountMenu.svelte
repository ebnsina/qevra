<script lang="ts">
	import {
		Add01Icon,
		Logout01Icon,
		Moon02Icon,
		Sun03Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import { flushSync, onMount, type Snippet } from 'svelte';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import * as Dropdown from './dropdown/index.js';
	import { isDark, setTheme } from './theme.js';

	interface Org {
		id: string;
		name: string;
	}

	interface Props {
		/** The signed-in person; their name gives the initials and the button's accessible name. */
		user: { name: string; email?: string; image?: string };
		/** Organizations to switch between; listed when there are any. */
		orgs?: Org[];
		/** The current organization's id; it gets a tick. */
		org?: string;
		onorg?: (org: Org) => void;
		/** Shows a "New organization" item when given. */
		onneworg?: () => void;
		/** Your own items (settings, billing), shown between the organizations and sign out. */
		children?: Snippet;
		/** Shows "Sign out" when given. */
		onsignout?: () => void;
		/** Shows a light/dark switch under the person's name. */
		theme?: boolean;
		/** Translate these for non-English UIs. */
		labels?: {
			account?: string;
			organizations?: string;
			newOrg?: string;
			signOut?: string;
			darkTheme?: string;
			lightTheme?: string;
		};
		class?: string;
	}

	let {
		user,
		orgs = [],
		org,
		onorg,
		onneworg,
		children,
		onsignout,
		theme = false,
		labels = {},
		class: className
	}: Props = $props();
	const t = $derived({
		account: 'Account',
		organizations: 'Organizations',
		newOrg: 'New organization',
		signOut: 'Sign out',
		darkTheme: 'Dark theme',
		lightTheme: 'Light theme',
		...labels
	});

	// Follows the theme wherever it changes (a toggle elsewhere, the system setting).
	let dark = $state(false);
	onMount(() => {
		if (!theme) return;
		const sync = () => (dark = isDark());
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
		const system = matchMedia('(prefers-color-scheme: dark)');
		system.addEventListener('change', sync);
		return () => {
			observer.disconnect();
			system.removeEventListener('change', sync);
		};
	});
</script>

<Dropdown.Root class={className}>
	{#snippet trigger(props)}
		<button {...props} class="trigger" aria-label="{t.account}: {user.name}">
			<Avatar name={user.name} src={user.image} size="sm" decorative />
		</button>
	{/snippet}
	<div class="who" role="none">
		<span class="name">{user.name}</span>
		{#if user.email}<span class="email">{user.email}</span>{/if}
	</div>
	{#if theme}
		<!-- Stays open, so the change is seen where it was made. -->
		<Dropdown.Item
			onselect={(e) => {
				e.preventDefault();
				const next = !dark;
				setTheme(next, e.currentTarget as Element, () => flushSync(() => (dark = next)));
			}}
		>
			<Icon icon={dark ? Sun03Icon : Moon02Icon} />
			{dark ? t.lightTheme : t.darkTheme}
		</Dropdown.Item>
	{/if}
	{#if orgs.length || onneworg}
		<Dropdown.Separator />
		<div class="section" role="none">{t.organizations}</div>
		{#each orgs as o (o.id)}
			<Dropdown.Item aria-current={o.id === org ? 'true' : undefined} onselect={() => onorg?.(o)}>
				<span class="org">{o.name}</span>
				{#if o.id === org}<span class="tick"><Icon icon={Tick02Icon} size={16} /></span>{/if}
			</Dropdown.Item>
		{/each}
		{#if onneworg}
			<Dropdown.Item onselect={() => onneworg()}><Icon icon={Add01Icon} /> {t.newOrg}</Dropdown.Item
			>
		{/if}
	{/if}
	{#if children}
		<Dropdown.Separator />
		{@render children()}
	{/if}
	{#if onsignout}
		<Dropdown.Separator />
		<Dropdown.Item onselect={() => onsignout()}
			><Icon icon={Logout01Icon} /> {t.signOut}</Dropdown.Item
		>
	{/if}
</Dropdown.Root>

<style>
	.trigger {
		display: inline-grid;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: none;
		cursor: pointer;
	}
	.trigger:focus-visible {
		outline: var(--ui-ring-width) solid var(--ui-ring);
		outline-offset: var(--ui-ring-offset);
	}
	.who {
		display: grid;
		gap: 0.125rem;
		padding: 0.5rem 0.625rem 0.375rem;
		min-inline-size: 14rem;
	}
	.name {
		font-size: var(--ui-font-size);
		font-weight: 500;
	}
	.email {
		color: var(--ui-muted);
		font-size: 0.8125rem;
	}
	.section {
		padding: 0.375rem 0.625rem 0.25rem;
		color: var(--ui-muted);
		font-size: 0.75rem;
		font-weight: 500;
	}
	.org {
		flex: 1;
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tick {
		display: inline-flex;
		margin-inline-start: auto;
	}
</style>
