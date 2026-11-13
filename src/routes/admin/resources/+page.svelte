<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
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
		{ name: 'title', label: 'Title', placeholder: 'Irregular Verbs', required: true },
		{ name: 'description', label: 'Short description', placeholder: 'The 120 irregular verbs you will meet most, with all three forms.', type: 'textarea', rows: 2 },
		{ name: 'file_key', label: 'File', type: 'file' },
		{ name: 'position', label: 'Order', placeholder: '1', type: 'number', required: true, hint: 'Lower numbers show first.' }
	]}
/>
