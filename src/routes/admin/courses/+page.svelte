<script lang="ts">
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import CrudPage from '#lib/components/CrudPage.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { money, number } from '#lib/format.ts';

	let { data } = $props();
</script>

<Seo title="Courses | Admin" description="Courses and their lessons." noindex />

<CrudPage
	title="Courses"
	noun="course"
	empty="Add your first course, then open it to add sections, lessons, quizzes and live classes."
	items={data.courses}
	editHref={(course) => `/admin/courses/${course?.id ?? 'new'}/edit`}
	columns={[
		{ label: 'Course', text: (c) => c.title },
		{ label: 'Fee', text: (c) => money(c.price), numeric: true },
		{ label: 'Lessons', text: (c) => number(c.lessons), numeric: true },
		{ label: 'Students', text: (c) => number(c.students), numeric: true },
		{ label: 'Status' }
	]}
>
	{#snippet cell(course)}
		<Badge tone={!course.published ? 'neutral' : course.enrollment_open ? 'accent' : 'warning'}>
			{!course.published ? 'Draft' : course.enrollment_open ? 'Open' : 'Coming soon'}
		</Badge>
	{/snippet}
</CrudPage>
