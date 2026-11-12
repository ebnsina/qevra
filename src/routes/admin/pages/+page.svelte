<script lang="ts">
	import Button from '#lib/sinaui/ui/Button.svelte';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
</script>

<Seo title="Pages | Admin" description="Text pages on the website." noindex />

<CrudPage
	title="Pages"
	noun="page"
	empty="Text pages such as About, Contact and Privacy. The website links to /about, /contact and /privacy."
	items={data.pages}
	{form}
	columns={[
		{ label: 'Title', text: (p) => p.title },
		{ label: 'Web address', text: (p) => `/${p.slug}` }
	]}
	fields={[
		{ name: 'title', label: 'Title', required: true },
		{ name: 'slug', label: 'Web address', required: true, hint: 'The header and footer link to about, contact and privacy.' },
		{ name: 'body', label: 'Text', type: 'textarea', rows: 18, hint: 'Markdown: ## for a heading, - for a list, **bold**.' }
	]}
>
	{#snippet rowActions(page)}<Button variant="outline" href="/{page.slug}" target="_blank">View</Button>{/snippet}
</CrudPage>
