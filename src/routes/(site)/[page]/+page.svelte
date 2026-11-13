<script lang="ts">
	import { CallIcon, Location01Icon, Mail01Icon, WhatsappIcon } from '@hugeicons/core-free-icons';
	import * as Accordion from '#lib/sinaui/ui/accordion/index.ts';
	import Button from '#lib/sinaui/ui/Button.svelte';
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
	const whatsapp = $derived(contacts.find((c) => c.label === 'WhatsApp'));
	const email = $derived(contacts.find((c) => c.label === 'Email'));
	// What people ask before joining. Each answer describes how the site itself works.
	const methods = $derived([settings.bkash_number && 'bKash', settings.nagad_number && 'Nagad'].filter(Boolean).join(' or '));
	const faqs = $derived(
		[
			{ q: 'How do I enroll in a course?', a: 'Create a free account, open the course and choose Enroll. Free courses start at once; paid courses open after we confirm your payment.' },
			methods && { q: 'How do I pay?', a: `Send the fee by ${methods}, then enter the transaction ID on the enrollment page. We confirm payments within a day.` },
			{ q: 'Can I try a course before paying?', a: 'Yes. Lessons marked "Preview" on a course page are free to watch without an account.' },
			{ q: 'Will I get a certificate?', a: 'Yes. Finish every lesson in a course and your certificate is issued with its own number that anyone can check.' },
			{ q: 'I forgot my password. What do I do?', a: 'Message us from the phone number or email on your account and we will set a new one for you.' }
		].filter((f) => !!f)
	);
</script>

<Seo
	title="{data.title} | {settings.name}"
	description={data.text}
	jsonLd={data.slug === 'contact'
		? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
		: undefined}
/>

<PageTop crumb={data.title} title={data.title} />

<section class="site-section">
	<div class="site-wrap body" class:contact>
		<div class="main">
			<div class="prose">{@html data.html}</div>
			{#if data.slug === 'contact'}
				{#if whatsapp || email}
					<div class="actions">
						{#if whatsapp}<Button size="lg" href={whatsapp.href}><Icon icon={WhatsappIcon} /> Chat on WhatsApp</Button>{/if}
						{#if email}<Button size="lg" variant="outline" href={email.href}><Icon icon={Mail01Icon} /> Send an email</Button>{/if}
					</div>
				{/if}
				<section class="faq" aria-labelledby="faq-title">
					<h2 class="site-h2" id="faq-title">Common questions</h2>
					<Accordion.Root>
						{#each faqs as faq, i (faq.q)}
							<Accordion.Item title={faq.q} open={i === 0}><p class="muted answer">{faq.a}</p></Accordion.Item>
						{/each}
					</Accordion.Root>
				</section>
			{/if}
		</div>
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
	.main {
		display: grid;
		gap: var(--space-12);
		max-width: 46rem;
		min-width: 0;
	}
	.prose {
		font-size: var(--text-lg);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	/* Questions and answers read at the page's text size, not the smaller size the accordion uses in the app. */
	.faq {
		--ui-font-size: var(--text-lg);
	}
	.answer {
		font-size: var(--text-lg);
	}
	.faq .site-h2 {
		margin-bottom: var(--space-4);
	}
	.answer {
		padding-bottom: var(--space-3);
	}
	@media (min-width: 56rem) {
		.contact {
			grid-template-columns: 1fr minmax(20rem, 24rem);
			align-items: start;
		}
		.reach {
			position: sticky;
			top: 6rem;
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
