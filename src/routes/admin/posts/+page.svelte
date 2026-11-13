<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
</script>

<Seo title="Blog posts | Admin" description="Posts on the website's blog." noindex />

<CrudPage
	title="Blog posts"
	noun="post"
	empty="Write short posts for the blog. A post shows on the website once you switch on Published."
	items={data.posts}
	editHref={(post) => `/admin/posts/${post?.id ?? 'new'}`}
	columns={[
		{ label: 'Title', text: (p) => p.title },
		{ label: 'Published', text: (p) => (p.published_at ? date(p.published_at) : '') },
		{ label: 'Status' }
	]}
>
	{#snippet cell(post)}
		<Badge tone={post.published ? 'accent' : 'neutral'}>{post.published ? 'Published' : 'Draft'}</Badge>
	{/snippet}
</CrudPage>
