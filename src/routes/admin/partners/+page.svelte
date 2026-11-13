<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
</script>

<Seo title="Partner logos | Admin" description="Logos shown under the home page heading." noindex />

<CrudPage
	title="Partner logos"
	noun="logo"
	empty="Add the logos of universities or organizations your students come from. They show in a row on the home page."
	items={data.partners}
	{form}
	columns={[
		{ label: 'Name', text: (p) => p.name },
		{ label: 'Order', text: (p) => String(p.position), numeric: true }
	]}
	fields={[
		{ name: 'name', label: 'Name', placeholder: 'University of Dhaka', required: true, hint: 'Read out to people who can\'t see the logo.' },
		{ name: 'image_key', label: 'Logo', type: 'image' },
		{ name: 'position', label: 'Order', placeholder: '1', type: 'number', required: true, hint: 'Lower numbers show first.' }
	]}
/>
