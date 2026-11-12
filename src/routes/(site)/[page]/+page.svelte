<script lang="ts">
	import { CallIcon, Location01Icon, Mail01Icon, WhatsappIcon } from '@hugeicons/core-free-icons';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SiteCta from '#lib/components/SiteCta.svelte';

	let { data } = $props();
	const settings = $derived(data.settings);
	const contacts = $derived(
		[
			{ icon: WhatsappIcon, label: 'WhatsApp', value: settings.whatsapp, href: `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` },
			{ icon: CallIcon, label: 'Phone', value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, '')}` },
			{ icon: Mail01Icon, label: 'Email', value: settings.email, href: `mailto:${settings.email}` },
			{ icon: Location01Icon, label: 'Address', value: settings.address, href: '' }
		].filter((c) => c.value)
	);
	const contact = $derived(data.slug === 'contact' && contacts.length > 0);
</script>

<Seo title="{data.title} | {settings.name}" description={data.text} />

<PageTop crumb={data.title} title={data.title} />

<section class="site-section">
	<div class="site-wrap body" class:contact>
		<div class="prose">{@html data.html}</div>
		{#if contact}
			<aside class="site-card reach" aria-label="Ways to reach us">
				<h2 class="site-h3">Reach us directly</h2>
				<ul>
					{#each contacts as item (item.label)}
						<li>
							<span class="app-icon"><Icon icon={item.icon} size={20} /></span>
							<p>
								<span class="muted">{item.label}</span>
								{#if item.href}<a href={item.href}>{item.value}</a>{:else}<strong>{item.value}</strong>{/if}
							</p>
						</li>
					{/each}
				</ul>
			</aside>
		{/if}
	</div>
</section>

{#if data.slug === 'contact'}
	<SiteCta title={data.closing.title} text={data.closing.text} href="/courses" label="See our courses" />
{:else}
	<SiteCta title={data.closing.title} text={data.closing.text} />
{/if}

<style>
	.body {
		display: grid;
		gap: var(--space-12);
	}
	.prose {
		max-width: 46rem;
		font-size: var(--text-lg);
	}
	@media (min-width: 56rem) {
		.contact {
			grid-template-columns: 1fr minmax(20rem, 24rem);
			align-items: start;
		}
	}
	.reach {
		background: var(--app-tint);
	}
	.reach ul {
		list-style: none;
		margin: var(--space-4) 0 0;
		padding: 0;
	}
	.reach li {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding-block: var(--space-4);
		border-top: 1px solid var(--ui-line);
	}
	.reach p {
		display: grid;
		font-size: var(--text-sm);
	}
	.reach a,
	.reach strong {
		color: var(--ui-text, inherit);
		font-size: var(--text-base);
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.reach a {
		color: var(--ui-accent);
	}
</style>
