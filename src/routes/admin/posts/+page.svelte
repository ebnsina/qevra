<script lang="ts">
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data, form } = $props();
</script>

<Seo title="Blog posts | Admin" description="Posts on the website's blog." noindex />

<CrudPage
	title="Blog posts"
	noun="post"
	empty="Write short posts for the blog. A post shows on the website once you switch on Published."
	items={data.posts}
	{form}
	columns={[
		{ label: 'Title', text: (p) => p.title },
		{ label: 'Published', text: (p) => (p.published_at ? date(p.published_at) : '') },
		{ label: 'Status' }
	]}
	fields={[
		{ name: 'title', label: 'Title', required: true },
		{ name: 'slug', label: 'Web address', required: true, hint: 'Lowercase words joined by dashes: the post opens at /blog/this-part.' },
		{ name: 'excerpt', label: 'Summary', type: 'textarea', rows: 2, hint: 'One or two sentences shown in lists and search results.' },
		{ name: 'body', label: 'Text', type: 'textarea', rows: 14, hint: 'Markdown: ## for a heading, - for a list, **bold**.' },
		{ name: 'image_key', label: 'Cover image', type: 'image' },
		{ name: 'published', label: 'Published', type: 'switch' }
	]}
>
	{#snippet cell(post)}
		<Badge tone={post.published ? 'accent' : 'neutral'}>{post.published ? 'Published' : 'Draft'}</Badge>
	{/snippet}
	{#snippet rowActions(post)}
		{#if post.published}<Button variant="outline" href="/blog/{post.slug}" target="_blank">View</Button>{/if}
	{/snippet}
</CrudPage>
