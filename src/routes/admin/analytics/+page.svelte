<script lang="ts">
	import { Analytics01Icon, BookOpen01Icon, Certificate01Icon, Quiz01Icon, StarIcon, UserGroupIcon, Wallet01Icon } from '@hugeicons/core-free-icons';
	import DetailSheet from '#lib/sinaui/blocks/studio/DetailSheet.svelte';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Stat from '#lib/sinaui/blocks/studio/Stat.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import Sparkline from '#lib/sinaui/ui/Sparkline.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { money, number, plural } from '#lib/format.ts';

	let { data } = $props();
	const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : 'None yet');
	const taka = (amount: number) => (amount ? money(amount) : '৳0');
	const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
	const enrollments = $derived(data.days.map((d) => d.enrollments));
	const income = $derived(data.days.map((d) => d.income));

	let openId = $state<string>();
	const course = $derived(data.courses.find((c) => c.id === openId));
	const lessons = $derived(data.lessons.filter((l) => l.course_id === openId));
</script>

<Seo title="Analytics | Admin" description="How each course is doing." noindex />

<div class="app-page">
	<PageHeader title="Analytics" description="The last 30 days, and how each course is doing since it opened." />

	<div class="trends">
		<Card title="New enrollments" icon={UserGroupIcon} level={2} description="Last 30 days">
			<p class="big">{number(sum(enrollments))}</p>
			<Sparkline values={enrollments} label="Enrollments per day over the last 30 days, {sum(enrollments)} in total" height={56} />
		</Card>
		<Card title="Confirmed income" icon={Wallet01Icon} level={2} description="Last 30 days">
			<p class="big">{taka(sum(income))}</p>
			<Sparkline values={income} label="Confirmed income per day over the last 30 days, {taka(sum(income))} in total" height={56} />
		</Card>
	</div>

	<Card title="Courses" icon={BookOpen01Icon} level={2} flush>
		{#if data.courses.length}
			<Table caption="Courses" hideCaption>
				<thead>
					<tr><th>Course</th><th class="num">Students</th><th class="num">Finished</th><th class="num">Quiz pass rate</th><th class="num">Rating</th><th class="num">Income</th></tr>
				</thead>
				<tbody>
					{#each data.courses as item (item.id)}
						<tr onclick={() => (openId = item.id)}>
							<td><RowLink label={item.title} onclick={() => (openId = item.id)} /></td>
							<td class="num">{number(item.students)}</td>
							<td class="num">{percent(item.completed, item.students)}</td>
							<td class="num">{percent(item.quiz_passes, item.quiz_tries)}</td>
							<td class="num">{item.rating ? `★ ${item.rating} (${item.reviews})` : 'None yet'}</td>
							<td class="num">{taka(item.income)}</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title="No courses yet" icon={Analytics01Icon}>Numbers appear here once you have a course with students.</EmptyState>
		{/if}
	</Card>
</div>

<DetailSheet
	bind:open={() => Boolean(course), (open) => !open && (openId = undefined)}
	title={course?.title ?? 'Course'}
	description="How this course is doing since it opened"
	fields={course
		? [
				{ label: 'Students', value: number(course.students), icon: UserGroupIcon, mono: true },
				{ label: 'Finished the course', value: `${number(course.completed)} (${percent(course.completed, course.students)})`, icon: Certificate01Icon },
				{ label: 'Quiz pass rate', value: `${percent(course.quiz_passes, course.quiz_tries)} of ${plural(course.quiz_tries, 'try', 'tries')}`, icon: Quiz01Icon },
				{ label: 'Rating', value: course.rating ? `★ ${course.rating} from ${plural(course.reviews, 'review')}` : 'No reviews yet', icon: StarIcon },
				{ label: 'Confirmed income', value: taka(course.income), icon: Wallet01Icon, mono: true }
			]
		: []}
>
	{#if course}
		<h3 class="sub">Where students are</h3>
		<p class="muted note">How many of the {plural(course.students, 'student')} finished each lesson. A sharp drop shows where they stop.</p>
		{#if lessons.length && course.students}
			<ol class="funnel">
				{#each lessons as lesson (lesson.id)}
					<li>
						<Progress label={lesson.title} value={lesson.done} max={course.students} format={(value, max) => `${value} of ${max}`} />
					</li>
				{/each}
			</ol>
		{:else}
			<p class="muted">{lessons.length ? 'No students yet.' : 'This course has no lessons yet.'}</p>
		{/if}
	{/if}
	{#snippet footer()}
		{#if course}<Button variant="outline" href="/admin/courses/{course.id}">Open the course</Button>{/if}
	{/snippet}
</DetailSheet>

<style>
	.trends {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: var(--app-gap);
	}
	.big {
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
		margin-bottom: 0.5rem;
	}
	.sub {
		font-size: 1.0625rem;
	}
	.note {
		margin: 0.25rem 0 1rem;
		font-size: 0.875rem;
	}
	.funnel {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.9rem;
	}
</style>
