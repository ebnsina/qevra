<script lang="ts">
	import Button from '#lib/sinaui/ui/Button.svelte';
	import EditorPage from '#lib/components/EditorPage.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data, form } = $props();
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
			{ name: 'title', label: 'Title', required: true },
			{ name: 'summary', label: 'Summary', type: 'textarea', rows: 2, hint: 'One or two sentences shown on course cards and under the title.' },
			{ name: 'description', label: 'Description', type: 'richtext' },
			{ name: 'outcomes', label: "What you'll learn", type: 'textarea', rows: 6, hint: 'One point per line.' },
			{ name: 'requirements', label: 'Requirements', type: 'textarea', rows: 3, hint: 'One per line.' }
		]}
		publish={[
			{ name: 'published', label: 'Published', type: 'switch', hint: 'Only published courses show on the website.' },
			{ name: 'enrollment_open', label: 'Open for enrollment', type: 'switch', hint: 'Off shows the course as "Coming soon": people can read about it but not join or pay.' }
		]}
		side={[
			{
				title: 'Fee',
				fields: [
					{ name: 'price', label: 'Fee in taka', type: 'number', required: true, hint: '0 makes the course free.' },
					{ name: 'regular_price', label: 'Regular fee (optional)', type: 'number', hint: 'When higher than the fee, it is shown struck through with the saving.' }
				]
			},
			{ title: 'Picture', fields: [{ name: 'image_key', label: 'Cover image', type: 'image', hint: 'A wide photo, about 800 × 420. Up to 4 MB.' }] },
			{
				title: 'Details',
				fields: [
					{ name: 'level', label: 'Level', hint: 'Beginner, Intermediate, Advanced…' },
					{ name: 'slug', label: 'Web address', required: true, hint: 'The course opens at /courses/this-part.' },
					{ name: 'position', label: 'Order', type: 'number', required: true, hint: 'Lower numbers show first.' }
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
