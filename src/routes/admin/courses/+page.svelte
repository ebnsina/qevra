<script lang="ts">
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { money, number } from '#lib/format.ts';

	let { data, form } = $props();
</script>

<Seo title="Courses | Admin" description="Courses and their lessons." noindex />

<CrudPage
	title="Courses"
	noun="course"
	empty="Add your first course, then open it to add sections, lessons, quizzes and live classes."
	items={data.courses}
	{form}
	columns={[
		{ label: 'Course', text: (c) => c.title },
		{ label: 'Fee', text: (c) => money(c.price), numeric: true },
		{ label: 'Lessons', text: (c) => number(c.lessons), numeric: true },
		{ label: 'Students', text: (c) => number(c.students), numeric: true },
		{ label: 'Status' }
	]}
	fields={[
		{ name: 'title', label: 'Title', required: true },
		{ name: 'slug', label: 'Web address', required: true, hint: 'Lowercase words joined by dashes: the course opens at /courses/this-part.' },
		{ name: 'level', label: 'Level', hint: 'Beginner, Intermediate, Classes 6 to 12…' },
		{ name: 'price', label: 'Fee in taka', type: 'number', required: true, hint: '0 makes the course free: students join without paying.' },
		{ name: 'summary', label: 'Summary', type: 'textarea', rows: 2, hint: 'One or two sentences shown on course cards.' },
		{ name: 'outcomes', label: "What you'll learn", type: 'textarea', rows: 5, hint: 'One point per line.' },
		{ name: 'requirements', label: 'Requirements', type: 'textarea', rows: 3, hint: 'One per line.' },
		{ name: 'description', label: 'Description', type: 'textarea', rows: 8, hint: 'Markdown: ## for a heading, - for a list, **bold**.' },
		{ name: 'image_key', label: 'Cover image', type: 'image', hint: 'A wide photo (about 800 × 420). JPG, PNG or WebP, up to 4 MB.' },
		{ name: 'position', label: 'Order', type: 'number', required: true, hint: 'Lower numbers show first.' },
		{ name: 'published', label: 'Published', type: 'switch', hint: 'Only published courses show on the website.' },
		{ name: 'enrollment_open', label: 'Open for enrollment', type: 'switch', hint: 'Off shows the course as "Coming soon": people can read about it but not join or pay.' }
	]}
>
	{#snippet cell(course)}
		<Badge tone={!course.published ? 'neutral' : course.enrollment_open ? 'accent' : 'warning'}>
			{!course.published ? 'Draft' : course.enrollment_open ? 'Open' : 'Coming soon'}
		</Badge>
	{/snippet}
	{#snippet rowActions(course)}
		<Button variant="outline" href="/admin/courses/{course.id}">Lessons</Button>
	{/snippet}
</CrudPage>
