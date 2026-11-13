<script lang="ts">
	import * as Tabs from '#lib/sinaui/ui/tabs/index.ts';
	import { adminPage, mutating } from '#lib/admin-query.svelte.ts';
	import { Home01Icon, Payment01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Fields from '#lib/components/Fields.svelte';
	import type { Field } from '#lib/components/fields.ts';
	import Seo from '#lib/components/Seo.svelte';
	import { message } from '#lib/messages.ts';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
	const errors = $derived(form && 'errors' in form ? form.errors : undefined);
	const settings = mutating();
	const home = mutating();

	const identity: Field[] = [
		{ name: 'name', label: 'Academy name', placeholder: 'Lisan Academy', required: true },
		{ name: 'tagline', label: 'Tagline', placeholder: 'English for work, study and everyday life', hint: 'A short line shown beside the name.' },
		{ name: 'description', label: 'Description', placeholder: 'An online English academy with recorded lessons, live classes and feedback from a teacher.', type: 'textarea', rows: 2, hint: 'One or two sentences for search results and the footer.' },
		{ name: 'logo_key', label: 'Logo', type: 'image', hint: 'A dark logo on a clear background works best. PNG or WebP, up to 4 MB.' },
		{ name: 'brand_color', label: 'Brand color', type: 'color', hint: 'Used for buttons, links and highlights.' }
	];
	const contact: Field[] = [
		{ name: 'email', label: 'Email', placeholder: 'hello@youracademy.com', type: 'email' },
		{ name: 'phone', label: 'Phone', placeholder: '+880 1700-000000' },
		{ name: 'whatsapp', label: 'WhatsApp number', placeholder: '+880 1700-000000', hint: 'With country code, like +880 1XXX-XXXXXX.' },
		{ name: 'address', label: 'Address', placeholder: 'House 12, Road 5, Dhanmondi, Dhaka' },
		{ name: 'facebook', label: 'Facebook link', placeholder: 'https://facebook.com/youracademy' },
		{ name: 'youtube', label: 'YouTube link', placeholder: 'https://youtube.com/@youracademy' },
		{ name: 'instagram', label: 'Instagram link', placeholder: 'https://instagram.com/youracademy' }
	];
	const payment: Field[] = [
		{ name: 'bkash_number', label: 'bKash number', placeholder: '01700-000000 (Personal)' },
		{ name: 'nagad_number', label: 'Nagad number', placeholder: '01700-000000 (Personal)' },
		{ name: 'payment_note', label: 'Instructions for students', placeholder: 'Send the fee with "Send Money", then enter the transaction ID below.', type: 'textarea', rows: 2, hint: 'Shown above the payment form.' }
	];
	const homeFields: Field[] = [
		{ name: 'badge', label: 'Announcement', placeholder: 'Admission open', hint: 'A short label above the heading, like "Admission open". Leave empty to hide it.' },
		{ name: 'cta_label', label: 'Main button text', placeholder: 'See the courses', required: true },
		{ name: 'title', label: 'Heading', placeholder: 'Learn the English you will actually use', required: true, wide: true },
		{ name: 'lede', label: 'Text under the heading', placeholder: 'Short lessons, live classes and feedback from a real teacher.', type: 'textarea', rows: 2 },
		{ name: 'facts', label: 'Facts row', placeholder: '12,000+ | students enrolled\n10 | courses', type: 'textarea', rows: 4, hint: 'One per line as: number | what it counts. Example: 12,000+ | students enrolled' },
		{ name: 'trusted_title', label: 'Line above the partner logos', placeholder: 'Trusted by students across Bangladesh', wide: true },
		{ name: 'about_title', label: 'About: heading', placeholder: 'A teacher who explains why', wide: true, hint: 'Leave empty to hide the About section.' },
		{ name: 'about_text', label: 'About: text', placeholder: 'Tell visitors who teaches here and how the academy started.', type: 'textarea', rows: 4 },
		{ name: 'about_quote', label: 'About: quote', placeholder: 'I teach the reasons, so the next question is easier.', type: 'textarea', rows: 2 },
		{ name: 'about_name', label: 'Founder or teacher name', placeholder: 'Farid Hasan', hint: 'Also shown as the instructor on course pages.' },
		{ name: 'about_role', label: 'Their role', placeholder: 'Founder and lead teacher' },
		{ name: 'points_title', label: 'Strengths: heading', placeholder: 'Why students choose us', wide: true },
		{ name: 'points', label: 'Strengths', placeholder: 'Open to everyone | Fully online, wherever you live.\nFair fees | Clear prices, with no hidden charges.', type: 'textarea', rows: 4, hint: 'One per line as: title | one sentence. Leave empty to hide the section.' },
		{ name: 'closing_title', label: 'Closing banner: heading', placeholder: 'Not sure which course fits you?', wide: true },
		{ name: 'closing_text', label: 'Closing banner: text', placeholder: 'Tell us what you need English for and we will point you to the right course.', type: 'textarea', rows: 2 }
	];

	let tab = $state('academy');
	const tabFields = { academy: identity, contact, payments: payment, home: homeFields };
	// A field the server turned down may sit on a tab that is not open: go to it.
	$effect(() => {
		const hit = errors && Object.entries(tabFields).find(([, fields]) => fields.some((f) => f.name in errors));
		if (hit) tab = hit[0];
	});
</script>

<Seo title="Site settings | Admin" description="The academy's details and home page content." noindex />

<div class="app-page">
	<PageHeader title="Site settings">
		{#snippet actions()}
			<Button variant="outline" href="/" target="_blank">View website</Button>
			<!-- One Save, in the header like the editors: it sends the form of the tab that is open. -->
			<Button type="submit" form={tab === 'home' ? 'home-form' : 'settings-form'} loading={settings.busy || home.busy}>
				{tab === 'home' ? 'Save home page' : 'Save settings'}
			</Button>
		{/snippet}
	</PageHeader>

	{#if form && 'saved' in form}<Alert tone="success" title="Saved. The website shows the changes now." live />{/if}
	{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}
	{#if errors}<Alert tone="danger" title="Some fields need a look. They are marked below." live />{/if}

	<!-- One group per tab. Panels stay in the page when hidden, so one Save still sends all three settings groups. -->
	<Tabs.Root variant="pill" fit bind:value={tab}>
		<Tabs.List label="Settings sections">
			<Tabs.Tab value="academy">Academy</Tabs.Tab>
			<Tabs.Tab value="contact">Contact and social</Tabs.Tab>
			<Tabs.Tab value="payments">Payments</Tabs.Tab>
			<Tabs.Tab value="home">Home page</Tabs.Tab>
		</Tabs.List>
		<!-- novalidate: the browser cannot point at a required field on a hidden tab; the server's answer opens that tab instead. -->
		<form id="settings-form" method="post" action="?/settings" enctype="multipart/form-data" class="app-form" novalidate style:display={tab === 'home' ? 'none' : undefined} onsubmit={settings.submit}>
			<Tabs.Panel value="academy" class="tab-panel">
				<Card title="Academy" icon={Settings01Icon} level={2} description="Name, logo and brand color, used on every page.">
					<Fields fields={identity} item={data.settings} {errors} columns={2} />
				</Card>
			</Tabs.Panel>
			<Tabs.Panel value="contact" class="tab-panel">
				<Card title="Contact and social" level={2} description="Shown in the top bar, the footer and the Contact page. Empty ones are hidden.">
					<Fields fields={contact} item={data.settings} {errors} columns={2} />
				</Card>
			</Tabs.Panel>
			<Tabs.Panel value="payments" class="tab-panel">
				<Card title="Payments" icon={Payment01Icon} level={2} description="Where students send course fees.">
					<Fields fields={payment} item={data.settings} {errors} columns={2} />
				</Card>
			</Tabs.Panel>
		</form>
		<form id="home-form" method="post" action="?/home" class="app-form" novalidate style:display={tab === 'home' ? undefined : 'none'} onsubmit={home.submit}>
			<Tabs.Panel value="home" class="tab-panel">
				<Card title="Home page" icon={Home01Icon} level={2} description="The words on the home page, top to bottom.">
					<Fields fields={homeFields} item={data.home} {errors} columns={2} />
				</Card>
			</Tabs.Panel>
		</form>
	</Tabs.Root>
</div>
