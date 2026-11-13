<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
</script>

<Seo title="Testimonials | Admin" description="Student reviews shown on the website." noindex />

<CrudPage
	title="Testimonials"
	noun="testimonial"
	empty="Add what students said about their course. Reviews show on the home page and the Reviews page."
	items={data.reviews}
	{form}
	columns={[
		{ label: 'Student', text: (r) => r.name },
		{ label: 'From', text: (r) => r.affiliation },
		{ label: 'Stars', text: (r) => String(r.rating), numeric: true },
		{ label: 'Order', text: (r) => String(r.position), numeric: true }
	]}
	fields={[
		{ name: 'name', label: 'Student name', placeholder: 'Nusrat Jahan', required: true },
		{ name: 'affiliation', label: 'University or workplace', placeholder: 'Job seeker' },
		{ name: 'body', label: 'What they said', placeholder: 'The reasons behind each answer were what I had been missing.', type: 'textarea', required: true },
		{ name: 'rating', label: 'Stars (1 to 5)', placeholder: '5', type: 'number', required: true },
		{ name: 'position', label: 'Order', placeholder: '1', type: 'number', required: true, hint: 'Lower numbers show first.' }
	]}
/>
