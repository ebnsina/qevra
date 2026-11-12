<script lang="ts">
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
</script>

<Seo title="Resources | Admin" description="Free downloads on the website." noindex />

<CrudPage
	title="Resources"
	noun="resource"
	empty="Upload word lists and study sheets. Visitors download them free from the Resources page."
	items={data.resources}
	{form}
	columns={[
		{ label: 'Title', text: (r) => r.title },
		{ label: 'File', text: (r) => r.file_name },
		{ label: 'Order', text: (r) => String(r.position), numeric: true }
	]}
	fields={[
		{ name: 'title', label: 'Title', required: true },
		{ name: 'description', label: 'Short description', type: 'textarea', rows: 2 },
		{ name: 'file_key', label: 'File', type: 'file' },
		{ name: 'position', label: 'Order', type: 'number', required: true, hint: 'Lower numbers show first.' }
	]}
/>
