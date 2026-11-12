<script lang="ts">
	import { CallIcon, Location01Icon, Mail01Icon, WhatsappIcon } from '@hugeicons/core-free-icons';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import PageTop from '#lib/components/PageTop.svelte';
	import Seo from '#lib/components/Seo.svelte';

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
</script>

<Seo title="{data.title} | {settings.name}" description={data.text} />

<PageTop crumb={data.title} title={data.title} />

<section class="site-section">
	<div class="site-wrap body">
		<div class="prose">{@html data.html}</div>
		{#if data.slug === 'contact' && contacts.length}
			<ul class="site-grid">
				{#each contacts as contact (contact.label)}
					<li class="site-card">
						<div class="card-head">
							<h2 class="site-h3">{contact.label}</h2>
							<span class="app-icon"><Icon icon={contact.icon} size={20} /></span>
						</div>
						<p>{#if contact.href}<a href={contact.href}>{contact.value}</a>{:else}{contact.value}{/if}</p>
					</li>
				{/each}
			</ul>
		{/if}
		<div><Button variant="outline" href="/courses">See our courses</Button></div>
	</div>
</section>

<style>
	.body {
		display: grid;
		gap: var(--space-8);
	}
	.site-card a {
		color: var(--ui-accent);
		font-weight: 600;
		overflow-wrap: anywhere;
	}
</style>
