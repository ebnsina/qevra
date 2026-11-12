<script lang="ts">
	import Button from '#lib/sinaui/ui/Button.svelte';
	import EditorPage from '#lib/components/EditorPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
</script>

<Seo title="{data.post?.title ?? 'New post'} | Admin" description="Write a blog post." noindex />

{#key data.post?.id}
	<EditorPage
		noun="post"
		back={{ href: '/admin/posts', label: 'All posts' }}
		item={data.post}
		{form}
		main={[
			{ name: 'title', label: 'Title', required: true },
			{ name: 'body', label: 'Text', type: 'richtext' }
		]}
		publish={[{ name: 'published', label: 'Published', type: 'switch', hint: 'Off keeps it as a draft only you can see.' }]}
		side={[
			{
				title: 'In lists and search',
				fields: [{ name: 'excerpt', label: 'Summary', type: 'textarea', rows: 3, hint: 'One or two sentences shown in lists and search results.' }]
			},
			{ title: 'Picture', fields: [{ name: 'image_key', label: 'Cover image', type: 'image' }] },
			{
				title: 'Link',
				fields: [{ name: 'slug', label: 'Web address', required: true, hint: 'Lowercase words joined by dashes: the post opens at /blog/this-part.' }]
			}
		]}
	>
		{#snippet actions(post)}
			{#if post.published}<Button variant="outline" size="sm" href="/blog/{post.slug}" target="_blank">View</Button>{/if}
		{/snippet}
	</EditorPage>
{/key}
