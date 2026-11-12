<script lang="ts">
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
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
		{ name: 'name', label: 'Name', required: true, hint: 'Read out to people who can\'t see the logo.' },
		{ name: 'image_key', label: 'Logo', type: 'image' },
		{ name: 'position', label: 'Order', type: 'number', required: true, hint: 'Lower numbers show first.' }
	]}
/>
