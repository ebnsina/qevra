<script lang="ts">
	import Button from '#lib/sinaui/ui/Button.svelte';
	import EditorPage from '#lib/components/EditorPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
</script>

<Seo title="{data.page?.title ?? 'New page'} | Admin" description="Write a page for the website." noindex />

{#key data.page?.id}
	<EditorPage
		noun="page"
		back={{ href: '/admin/pages', label: 'All pages' }}
		item={data.page}
		{form}
		main={[
			{ name: 'title', label: 'Title', placeholder: 'About us', required: true },
			{ name: 'body', label: 'Text', type: 'richtext' }
		]}
		publish={[]}
		side={[
			{
				title: 'Link',
				fields: [{ name: 'slug', label: 'Web address', placeholder: 'about', required: true, hint: 'The header and footer link to about, contact and privacy.' }]
			}
		]}
	>
		{#snippet actions(page)}<Button variant="outline" size="sm" href="/{page.slug}" target="_blank">View</Button>{/snippet}
	</EditorPage>
{/key}
