<script lang="ts">
	import { enhance } from '$app/forms';
	import { Home01Icon, Payment01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Fields from '#lib/components/Fields.svelte';
	import type { Field } from '#lib/components/fields.ts';
	import Seo from '#lib/components/Seo.svelte';
	import { message } from '#lib/messages.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();
	const errors = $derived(form && 'errors' in form ? form.errors : undefined);
	const settings = submitting();
	const home = submitting();

	const identity: Field[] = [
		{ name: 'name', label: 'Academy name', required: true },
		{ name: 'tagline', label: 'Tagline', hint: 'A short line shown beside the name.' },
		{ name: 'description', label: 'Description', type: 'textarea', rows: 2, hint: 'One or two sentences for search results and the footer.' },
		{ name: 'logo_key', label: 'Logo', type: 'image', hint: 'A dark logo on a clear background works best. PNG or WebP, up to 4 MB.' },
		{ name: 'brand_color', label: 'Brand color', type: 'color', hint: 'Used for buttons, links and highlights.' }
	];
	const contact: Field[] = [
		{ name: 'email', label: 'Email', type: 'email' },
		{ name: 'phone', label: 'Phone' },
		{ name: 'whatsapp', label: 'WhatsApp number', hint: 'With country code, like +880 1XXX-XXXXXX.' },
		{ name: 'address', label: 'Address' },
		{ name: 'facebook', label: 'Facebook link' },
		{ name: 'youtube', label: 'YouTube link' },
		{ name: 'instagram', label: 'Instagram link' }
	];
	const payment: Field[] = [
		{ name: 'bkash_number', label: 'bKash number' },
		{ name: 'nagad_number', label: 'Nagad number' },
		{ name: 'payment_note', label: 'Instructions for students', type: 'textarea', rows: 2, hint: 'Shown above the payment form.' }
	];
	const homeFields: Field[] = [
		{ name: 'badge', label: 'Announcement', hint: 'A short label above the heading, like "Admission open". Leave empty to hide it.' },
		{ name: 'cta_label', label: 'Main button text', required: true },
		{ name: 'title', label: 'Heading', required: true, wide: true },
		{ name: 'lede', label: 'Text under the heading', type: 'textarea', rows: 2 },
		{ name: 'facts', label: 'Facts row', type: 'textarea', rows: 4, hint: 'One per line as: number | what it counts. Example: 12,000+ | students enrolled' },
		{ name: 'trusted_title', label: 'Line above the partner logos', wide: true },
		{ name: 'about_title', label: 'About: heading', wide: true, hint: 'Leave empty to hide the About section.' },
		{ name: 'about_text', label: 'About: text', type: 'textarea', rows: 4 },
		{ name: 'about_quote', label: 'About: quote', type: 'textarea', rows: 2 },
		{ name: 'about_name', label: 'Founder or teacher name', hint: 'Also shown as the instructor on course pages.' },
		{ name: 'about_role', label: 'Their role' },
		{ name: 'points_title', label: 'Strengths: heading', wide: true },
		{ name: 'points', label: 'Strengths', type: 'textarea', rows: 4, hint: 'One per line as: title | one sentence. Leave empty to hide the section.' },
		{ name: 'closing_title', label: 'Closing banner: heading', wide: true },
		{ name: 'closing_text', label: 'Closing banner: text', type: 'textarea', rows: 2 }
	];
</script>

<Seo title="Site settings | Admin" description="The academy's details and home page content." noindex />

<div class="app-page">
	<PageHeader title="Site settings">
		{#snippet actions()}<Button variant="outline" href="/" target="_blank">View website</Button>{/snippet}
	</PageHeader>

	{#if form && 'saved' in form}<Alert tone="success" title="Saved. The website shows the changes now." live />{/if}
	{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}
	{#if errors}<Alert tone="danger" title="Some fields need a look. They are marked below." live />{/if}

	<form method="post" action="?/settings" enctype="multipart/form-data" class="app-form" use:enhance={settings.enhance}>
		<Card title="Academy" icon={Settings01Icon} level={2} description="Name, logo and brand color, used on every page.">
			<Fields fields={identity} item={data.settings} {errors} columns={2} />
		</Card>
		<Card title="Contact and social" level={2} description="Shown in the top bar, the footer and the Contact page. Empty ones are hidden.">
			<Fields fields={contact} item={data.settings} {errors} columns={2} />
		</Card>
		<Card title="Payments" icon={Payment01Icon} level={2} description="Where students send course fees.">
			<Fields fields={payment} item={data.settings} {errors} columns={2} />
		</Card>
		<div class="app-form-actions"><Button type="submit" loading={settings.busy}>Save settings</Button></div>
	</form>

	<form method="post" action="?/home" class="app-form" use:enhance={home.enhance}>
		<Card title="Home page" icon={Home01Icon} level={2} description="The words on the home page, top to bottom.">
			<Fields fields={homeFields} item={data.home} {errors} columns={2} />
		</Card>
		<div class="app-form-actions"><Button type="submit" loading={home.busy}>Save home page</Button></div>
	</form>
</div>
