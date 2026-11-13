<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
</script>

<Seo title="Pages | Admin" description="Text pages on the website." noindex />

<CrudPage
	title="Pages"
	noun="page"
	empty="Text pages such as About, Contact and Privacy. The website links to /about, /contact and /privacy."
	items={data.pages}
	editHref={(page) => `/admin/pages/${page?.id ?? 'new'}`}
	columns={[
		{ label: 'Title', text: (p) => p.title },
		{ label: 'Web address', text: (p) => `/${p.slug}` }
	]}
/>
