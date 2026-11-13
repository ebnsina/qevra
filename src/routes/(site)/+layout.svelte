<script lang="ts">
	import { page } from '$app/state';
	import { CallIcon, Facebook01Icon, InstagramIcon, Mail01Icon, Menu01Icon, WhatsappIcon, YoutubeIcon } from '@hugeicons/core-free-icons';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import ThemeToggle from '#lib/sinaui/ui/ThemeToggle.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { reveal } from '#lib/reveal.ts';

	let { data, children } = $props();
	const settings = $derived(data.settings);
	let menu = $state(false);

	// Re-arm the scroll reveal for each page's own cards.
	$effect(() => {
		void page.url.pathname;
		return reveal();
	});

	const nav = [
		{ href: '/courses', label: 'Courses' },
		{ href: '/about', label: 'About' },
		{ href: '/reviews', label: 'Reviews' },
		{ href: '/resources', label: 'Resources' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/contact', label: 'Contact' }
	];
	const whatsapp = $derived(settings.whatsapp && `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`);
	const socials = $derived(
		[
			{ href: settings.facebook, label: 'Facebook', icon: Facebook01Icon },
			{ href: settings.youtube, label: 'YouTube', icon: YoutubeIcon },
			{ href: settings.instagram, label: 'Instagram', icon: InstagramIcon }
		].filter((s) => s.href)
	);
	const dashboard = $derived(data.user?.role === 'admin' ? '/admin' : '/portal');
	const current = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<a class="skip" href="#main">Skip to content</a>

{#if whatsapp || settings.phone || settings.email || socials.length}
	<div class="util">
		<div class="site-wrap util-row">
			<span>
				{#if whatsapp}
					<a href={whatsapp}><Icon icon={WhatsappIcon} size={14} />{settings.whatsapp}</a>
				{:else if settings.phone}
					<a href="tel:{settings.phone.replace(/[^\d+]/g, '')}"><Icon icon={CallIcon} size={14} />{settings.phone}</a>
				{/if}
			</span>
			<span class="util-end">
				{#if settings.email}<a href="mailto:{settings.email}" class="mail"><Icon icon={Mail01Icon} size={14} />{settings.email}</a>{/if}
				{#each socials as social (social.label)}
					<a href={social.href} aria-label={social.label} rel="noopener"><Icon icon={social.icon} size={16} /></a>
				{/each}
			</span>
		</div>
	</div>
{/if}

<header class="top">
	<div class="site-wrap bar">
		<Logo name={settings.name} logoKey={settings.logo_key} />
		<nav aria-label="Main">
			<ul>
				{#each nav as item (item.href)}
					<li><a href={item.href} aria-current={current(item.href) ? 'page' : undefined}>{item.label}</a></li>
				{/each}
			</ul>
		</nav>
		<div class="end">
			<ThemeToggle />
			{#if data.user}
				<Button href={dashboard}>Dashboard</Button>
			{:else}
				<Button href="/login" variant="ghost" class="wide-only">Sign in</Button>
				<Button href="/register">Join now</Button>
			{/if}
			<Button variant="ghost" square class="narrow-only" aria-label="Menu" onclick={() => (menu = true)}>
				<Icon icon={Menu01Icon} />
			</Button>
		</div>
	</div>
</header>

<Dialog bind:open={menu} side="end" title="Menu">
	<ul class="sheet-nav">
		{#each nav as item (item.href)}
			<li><a href={item.href} onclick={() => (menu = false)}>{item.label}</a></li>
		{/each}
		<li><a href={data.user ? dashboard : '/login'} onclick={() => (menu = false)}>{data.user ? 'Dashboard' : 'Sign in'}</a></li>
	</ul>
</Dialog>

<main id="main">{@render children()}</main>

<footer class="foot">
	<div class="site-wrap grid">
		<div class="about">
			<Logo name={settings.name} logoKey={settings.logo_key} />
			<p>{settings.description}</p>
			<ul class="contact">
				{#if whatsapp}<li><Icon icon={WhatsappIcon} size={16} /><a href={whatsapp}>{settings.whatsapp}</a></li>{/if}
				{#if settings.phone}<li><Icon icon={CallIcon} size={16} /><a href="tel:{settings.phone.replace(/[^\d+]/g, '')}">{settings.phone}</a></li>{/if}
				{#if settings.email}<li><Icon icon={Mail01Icon} size={16} /><a href="mailto:{settings.email}">{settings.email}</a></li>{/if}
			</ul>
		</div>
		<div>
			<h2>Learn</h2>
			<ul>
				<li><a href="/courses">Courses</a></li>
				<li><a href="/resources">Free resources</a></li>
				<li><a href="/blog">Blog</a></li>
			</ul>
		</div>
		<div>
			<h2>Academy</h2>
			<ul>
				<li><a href="/about">About us</a></li>
				<li><a href="/reviews">Reviews</a></li>
				<li><a href="/contact">Contact us</a></li>
			</ul>
		</div>
		<div>
			<h2>Students</h2>
			<ul>
				<li><a href="/login">Sign in</a></li>
				<li><a href="/register">Create an account</a></li>
				<li><a href="/privacy">Privacy policy</a></li>
			</ul>
		</div>
	</div>
	<div class="site-wrap legal">
		<p>© {new Date().getFullYear()} {settings.name}{settings.tagline ? `, ${settings.tagline}` : ''}</p>
		<div class="social">
			{#each socials as social (social.label)}
				<a href={social.href} aria-label={social.label} rel="noopener"><Icon icon={social.icon} /></a>
			{/each}
			<ThemeToggle size="sm" />
		</div>
	</div>
</footer>

<style>
	.skip {
		position: absolute;
		left: 1rem;
		top: -3rem;
		z-index: 10;
		padding: 0.5rem 0.75rem;
		border-radius: var(--ui-radius-control);
		background: var(--ui-accent);
		color: var(--ui-on-accent);
	}
	.skip:focus {
		top: 0.75rem;
	}
	.util {
		background: var(--ui-accent);
		color: var(--ui-on-accent);
		font-size: var(--text-xs);
	}
	.util-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 2.25rem;
	}
	.util span,
	.util a {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: inherit;
		text-decoration: none;
	}
	.util .util-end {
		gap: 1rem;
	}
	@media (max-width: 40rem) {
		.util .mail {
			display: none;
		}
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 5;
		background: color-mix(in srgb, var(--ui-bg) 85%, transparent);
		backdrop-filter: blur(12px);
		box-shadow: var(--ui-shadow-xs);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		height: 4.25rem;
	}
	nav {
		margin-inline: auto;
	}
	nav ul,
	.sheet-nav,
	.foot ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	nav ul {
		display: flex;
		gap: 0.25rem;
	}
	nav a {
		display: block;
		padding: 0.375rem 0.75rem;
		border-radius: var(--ui-radius-control);
		color: var(--ui-muted);
		font-size: var(--text-sm);
		font-weight: 500;
		text-decoration: none;
	}
	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--ui-accent);
		background: var(--app-tint);
	}
	.end {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.end :global(.narrow-only) {
		display: none;
	}
	@media (max-width: 60rem) {
		nav,
		.end :global(.wide-only),
		.end > :global(:first-child) {
			display: none;
		}
		.end {
			margin-inline-start: auto;
		}
		.end :global(.narrow-only) {
			display: inline-flex;
		}
	}
	.sheet-nav a {
		display: block;
		padding: 0.75rem 0;
		font-size: var(--text-lg);
		text-decoration: none;
		border-bottom: 1px solid var(--ui-line);
	}

	.foot {
		background: var(--app-tint);
		padding-block: 3.5rem 1.5rem;
		font-size: var(--text-sm);
	}
	.grid {
		display: grid;
		grid-template-columns: 2fr repeat(3, 1fr);
		gap: 2rem;
	}
	@media (max-width: 52rem) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
		.about {
			grid-column: 1 / -1;
		}
	}
	.about p {
		color: var(--ui-muted);
		margin-block: 0.75rem 1rem;
		max-width: 26rem;
	}
	.contact li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ui-muted);
	}
	.foot h2 {
		font-family: var(--ui-font);
		font-size: var(--text-sm);
		font-weight: 700;
		letter-spacing: 0;
		margin-bottom: 0.75rem;
	}
	.foot li {
		margin-bottom: 0.5rem;
	}
	.foot a {
		color: var(--ui-muted);
		text-decoration: none;
	}
	.foot a:hover {
		color: var(--ui-accent);
	}
	.legal {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 2.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--ui-line);
		color: var(--ui-muted);
	}
	.social {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
</style>
