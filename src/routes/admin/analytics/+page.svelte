<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Analytics01Icon,
		BookOpen01Icon,
		Certificate01Icon,
		Payment01Icon,
		Quiz01Icon,
		StarIcon,
		UserGroupIcon,
		Wallet01Icon
	} from '@hugeicons/core-free-icons';
	import DetailSheet from '#lib/sinaui/blocks/studio/DetailSheet.svelte';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Stat from '#lib/sinaui/blocks/studio/Stat.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import CustomSelect from '#lib/sinaui/ui/CustomSelect.svelte';
	import StatTabs from '#lib/sinaui/ui/StatTabs.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import * as Tabs from '#lib/sinaui/ui/tabs/index.ts';
	import Seo from '#lib/components/Seo.svelte';
	import TrendChart from '#lib/components/TrendChart.svelte';
	import { dayShort, money, number, plural } from '#lib/format.ts';

	let { data } = $props();
	const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : 'None yet');
	const taka = (amount: number) => (amount ? money(amount) : '৳0');
	const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
	const period = $derived(data.days === 365 ? 'the last 12 months' : `the last ${data.days} days`);
	const methodName = { bkash: 'bKash', nagad: 'Nagad' } as Record<string, string>;
	const statusName = { approved: 'Confirmed', pending: 'Waiting', rejected: 'Not confirmed' } as Record<string, string>;

	const column = (key: 'enrollments' | 'income' | 'signups' | 'lessons' | 'quizzes') => data.series.map((d) => d[key]);
	const series = $derived({
		enrollments: { label: 'Enrollments', values: column('enrollments'), display: (n: number) => number(n) },
		income: { label: 'Income', values: column('income'), display: taka },
		signups: { label: 'New students', values: column('signups'), display: (n: number) => number(n) },
		lessons: { label: 'Lessons finished', values: column('lessons'), display: (n: number) => number(n) },
		quizzes: { label: 'Quiz tries', values: column('quizzes'), display: (n: number) => number(n) }
	});
	let metric = $state<keyof typeof series>('enrollments');
	const items = $derived(Object.entries(series).map(([value, s]) => ({ value, label: s.label, display: s.display(sum(s.values)) })));
	const chosen = $derived(series[metric]);

	const stats = $derived([
		{ label: 'Enrollments', value: number(sum(series.enrollments.values)), hint: `In ${period}`, icon: BookOpen01Icon },
		{ label: 'Income', value: taka(sum(series.income.values)), hint: 'Payments you confirmed', icon: Wallet01Icon },
		{ label: 'Active students', value: number(data.totals.active), hint: 'Finished at least one lesson', icon: UserGroupIcon },
		{ label: 'Courses finished', value: percent(data.totals.completed, data.totals.enrollments), hint: `${number(data.totals.completed)} of ${number(data.totals.enrollments)} enrollments, all time`, icon: Certificate01Icon },
		{ label: 'Quiz pass rate', value: percent(data.totals.passes, data.totals.tries), hint: `${plural(data.totals.tries, 'try', 'tries')} in ${period}`, icon: Quiz01Icon },
		{ label: 'Average rating', value: data.totals.rating ? `★ ${data.totals.rating}` : 'None yet', hint: `${plural(data.totals.reviews, 'published review')}`, icon: StarIcon }
	]);
	const topIncome = $derived(Math.max(...data.income.map((c) => c.income), 1));
	const paid = $derived(sum(data.methods.map((m) => m.payments)));
	const allPayments = $derived(sum(data.statuses.map((s) => s.payments)));
	const allRatings = $derived(sum(data.ratings.map((r) => r.reviews)));

	let openId = $state<string>();
	const course = $derived(data.courses.find((c) => c.id === openId));
	const lessons = $derived(data.lessons.filter((l) => l.course_id === openId));
</script>

<Seo title="Analytics | Admin" description="How the academy and each course are doing." noindex />

<div class="app-page">
	<PageHeader title="Analytics" description="Trends, money, ratings and quizzes for {period}, and every course since it opened.">
		{#snippet actions()}
			<CustomSelect label="Period" hideLabel value={String(data.days)} onchange={(value) => goto(`?days=${value}`)} options={[{ value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: '365', label: 'Last 12 months' }]} />
		{/snippet}
	</PageHeader>

	<div class="stats">
		{#each stats as stat (stat.label)}<Stat label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} />{/each}
	</div>

	<Tabs.Root variant="pill" fit>
		<Tabs.List label="Analytics sections">
			<Tabs.Tab value="trends">Trends</Tabs.Tab>
			<Tabs.Tab value="income">Income by course</Tabs.Tab>
			<Tabs.Tab value="payments">How students pay</Tabs.Tab>
			<Tabs.Tab value="ratings">Ratings</Tabs.Tab>
			<Tabs.Tab value="quizzes">Hardest quizzes</Tabs.Tab>
			<Tabs.Tab value="students">Most active students</Tabs.Tab>
			<Tabs.Tab value="courses">Courses</Tabs.Tab>
		</Tabs.List>
		<Tabs.Panel value="trends" class="tab-panel">
	<Card flush>
		<StatTabs label="What the chart shows" {items} bind:value={metric} />
		<div class="chart">
			{#if sum(chosen.values)}
				<TrendChart
					title="{chosen.label}, {period}"
					description="One point per day."
					labels={data.series.map((d) => dayShort(d.day))}
					values={chosen.values}
					aspectRatio={3.6}
				/>
			{:else}
				<p class="muted flat">Nothing to show for {period} yet.</p>
			{/if}
		</div>
	</Card>
		</Tabs.Panel>

		<Tabs.Panel value="income" class="tab-panel">
		<Card title="Income by course" icon={Wallet01Icon} level={2} description="Confirmed payments in {period}.">
			{#if data.income.length}
				<ul class="bars">
					{#each data.income as item (item.id)}
						<li>
							<Progress label={item.title} value={item.income} max={topIncome} format={() => `${taka(item.income)} · ${plural(item.payments, 'payment')}`} />
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted">No confirmed payments in {period}.</p>
			{/if}
		</Card>
		</Tabs.Panel>

		<Tabs.Panel value="payments" class="tab-panel">
		<Card title="How students pay" icon={Payment01Icon} level={2} description="Payments sent in {period}.">
			{#if allPayments}
				<ul class="bars">
					{#each data.methods as method (method.method)}
						<li>
							<Progress label={methodName[method.method] ?? method.method} value={method.payments} max={paid} format={() => `${percent(method.payments, paid)} · ${taka(method.income)}`} />
						</li>
					{/each}
				</ul>
				<dl class="app-fields facts">
					{#each data.statuses as status (status.status)}
						<dt>{statusName[status.status] ?? status.status}</dt>
						<dd>{plural(status.payments, 'payment')} ({percent(status.payments, allPayments)})</dd>
					{/each}
					<dt>Paid with a coupon</dt>
					<dd>{plural(data.totals.coupons, 'payment')}</dd>
				</dl>
			{:else}
				<p class="muted">No payments in {period}.</p>
			{/if}
		</Card>
		</Tabs.Panel>

		<Tabs.Panel value="ratings" class="tab-panel">
		<Card title="Ratings" icon={StarIcon} level={2} description="Published reviews, all courses.">
			{#if allRatings}
				<ul class="bars">
					{#each data.ratings as row (row.rating)}
						<li>
							<Progress label={'★'.repeat(row.rating)} value={row.reviews} max={allRatings} format={() => `${number(row.reviews)} (${percent(row.reviews, allRatings)})`} />
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted">No published reviews yet.</p>
			{/if}
		</Card>
		</Tabs.Panel>

		<Tabs.Panel value="quizzes" class="tab-panel">
		<Card title="Hardest quizzes" icon={Quiz01Icon} level={2} description="Lowest pass rates. A lesson to explain again, or a question to reword.">
			{#if data.quizzes.length}
				<ul class="bars">
					{#each data.quizzes as quiz (quiz.id)}
						<li>
							<Progress label={quiz.lesson} value={quiz.passes} max={quiz.tries} format={() => `${percent(quiz.passes, quiz.tries)} of ${plural(quiz.tries, 'try', 'tries')} passed`} />
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted">Not enough quiz tries yet to compare.</p>
			{/if}
		</Card>
		</Tabs.Panel>

		<Tabs.Panel value="students" class="tab-panel">
		<Card title="Most active students" icon={UserGroupIcon} level={2} description="Lessons finished in {period}." flush>
			{#if data.students.length}
				<ol class="ranks">
					{#each data.students as student, i (student.id)}
						<li><span class="rank">{i + 1}</span><strong>{student.name}</strong><span class="muted">{plural(student.lessons, 'lesson')}</span></li>
					{/each}
				</ol>
			{:else}
				<p class="muted none">Nobody finished a lesson in {period}.</p>
			{/if}
		</Card>
		</Tabs.Panel>

		<Tabs.Panel value="courses" class="tab-panel">
	<Card title="Courses" icon={BookOpen01Icon} level={2} description="Since each course opened. Open one to see where its students stop." flush>
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
		</Tabs.Panel>
	</Tabs.Root>
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
				{ label: 'Confirmed income', value: taka(course.income), icon: Wallet01Icon, mono: true },
				{ label: 'Lessons', value: number(course.lessons), icon: BookOpen01Icon, mono: true }
			]
		: []}
>
	{#if course}
		<h3 class="sub">Where students are</h3>
		<p class="muted note">How many of the {plural(course.students, 'student')} finished each lesson. A sharp drop shows where they stop.</p>
		{#if lessons.length && course.students}
			<ol class="bars">
				{#each lessons as lesson (lesson.id)}
					<li><Progress label={lesson.title} value={lesson.done} max={course.students} format={(value, max) => `${value} of ${max}`} /></li>
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
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: var(--app-gap);
	}
	.chart {
		padding: 1rem 1.25rem 1.25rem;
	}
	.flat {
		padding-block: 2.5rem;
		text-align: center;
		font-size: 0.875rem;
	}
	.bars,
	.ranks {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.bars {
		display: grid;
		gap: 0.9rem;
	}
	.facts {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--ui-line);
	}
	.ranks li {
		display: grid;
		grid-template-columns: 1.75rem 1fr auto;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1.25rem;
		border-top: 1px solid var(--ui-line);
		font-size: 0.875rem;
	}
	.rank {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: var(--app-tint-strong);
		color: var(--ui-accent);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.none {
		padding: 1rem 1.25rem;
		font-size: 0.875rem;
	}
	.sub {
		font-size: 1.0625rem;
	}
	.note {
		margin: 0.25rem 0 1rem;
		font-size: 0.875rem;
	}
</style>
