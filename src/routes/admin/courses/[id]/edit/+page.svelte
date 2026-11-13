<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import EditorPage from '#lib/components/EditorPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
</script>

<Seo title="{data.course?.title ?? 'New course'} | Admin" description="A course's details." noindex />

{#key data.course?.id}
	<EditorPage
		noun="course"
		back={{ href: '/admin/courses', label: 'All courses' }}
		item={data.course}
		defaults={{ position: data.next, price: 0 }}
		{form}
		main={[
			{ name: 'title', label: 'Title', placeholder: 'English for Beginners', required: true },
			{ name: 'summary', label: 'Summary', placeholder: 'Build a solid foundation: how English sentences are put together.', type: 'textarea', rows: 2, hint: 'One or two sentences shown on course cards and under the title.' },
			{ name: 'description', label: 'Description', type: 'richtext' },
			{ name: 'outcomes', label: "What you'll learn", placeholder: 'Understand how a noun phrase is built\nChoose the right determiner', type: 'textarea', rows: 6, hint: 'One point per line.' },
			{ name: 'requirements', label: 'Requirements', placeholder: 'You can read simple English sentences', type: 'textarea', rows: 3, hint: 'One per line.' }
		]}
		publish={[
			{ name: 'published', label: 'Published', type: 'switch', hint: 'Only published courses show on the website.' },
			{ name: 'enrollment_open', label: 'Open for enrollment', type: 'switch', hint: 'Off shows the course as "Coming soon": people can read about it but not join or pay.' }
		]}
		side={[
			{
				title: 'Fee',
				fields: [
					{ name: 'price', label: 'Fee in taka', placeholder: '2500', type: 'number', required: true, hint: '0 makes the course free.' },
					{ name: 'regular_price', label: 'Regular fee (optional)', placeholder: '4000', type: 'number', hint: 'When higher than the fee, it is shown struck through with the saving.' }
				]
			},
			{ title: 'Picture', fields: [{ name: 'image_key', label: 'Cover image', type: 'image', hint: 'A wide photo, about 800 × 420. Up to 4 MB.' }] },
			{
				title: 'Details',
				fields: [
					{ name: 'level', label: 'Level', placeholder: 'Beginner', hint: 'Beginner, Intermediate, Advanced…' },
					{ name: 'slug', label: 'Web address', placeholder: 'english-for-beginners', required: true, hint: 'The course opens at /courses/this-part.' },
					{ name: 'position', label: 'Order', placeholder: '1', type: 'number', required: true, hint: 'Lower numbers show first.' }
				]
			}
		]}
	>
		{#snippet actions(course)}
			<Button variant="outline" size="sm" href="/admin/courses/{course.id}">Lessons</Button>
			<Button variant="outline" size="sm" href="/courses/{course.slug}" target="_blank">View</Button>
		{/snippet}
	</EditorPage>
{/key}
