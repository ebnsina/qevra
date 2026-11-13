<script lang="ts">
	import { adminPage } from '#lib/admin-query.svelte.ts';
	import {
		BookOpen01Icon,
		Certificate01Icon,
		MessageQuestionIcon,
		Payment01Icon,
		Task01Icon,
		UserGroupIcon,
		Wallet01Icon
	} from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Stat from '#lib/sinaui/blocks/studio/Stat.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import StatTabs from '#lib/sinaui/ui/StatTabs.svelte';
	import * as Tabs from '#lib/sinaui/ui/tabs/index.ts';
	import Seo from '#lib/components/Seo.svelte';
	import TrendChart from '#lib/components/TrendChart.svelte';
	import { date, dayShort, money, number, plural } from '#lib/format.ts';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const taka = (amount: number) => (amount ? money(amount) : '৳0');
	const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
	const short = (text: string) => (text.length > 60 ? `${text.slice(0, 60)}…` : text);

	const stats = $derived([
		{ label: 'Students', value: number(data.totals.students), icon: UserGroupIcon, hint: `${plural(data.totals.courses, 'course')} on the website` },
		{ label: 'Enrollments', value: number(data.totals.enrollments), icon: BookOpen01Icon, hint: 'Since you opened' },
		{ label: 'Courses completed', value: number(data.totals.completed), icon: Certificate01Icon, hint: 'Each one earned a certificate' },
		{ label: 'Confirmed income', value: taka(data.totals.income), icon: Wallet01Icon, hint: 'Payments you confirmed' }
	]);

	// The four things the chart can show; the tabs carry each one's 30-day total.
	const labels = $derived(data.days.map((d) => dayShort(d.day)));
	const series = $derived({
		enrollments: { label: 'Enrollments', values: data.days.map((d) => d.enrollments), display: (n: number) => number(n) },
		income: { label: 'Income', values: data.days.map((d) => d.income), display: taka },
		signups: { label: 'New students', values: data.days.map((d) => d.signups), display: (n: number) => number(n) },
		lessons: { label: 'Lessons completed', values: data.days.map((d) => d.lessons), display: (n: number) => number(n) }
	});
	let metric = $state<keyof typeof series>('enrollments');
	const items = $derived(Object.entries(series).map(([value, s]) => ({ value, label: s.label, display: s.display(sum(s.values)) })));
	const chosen = $derived(series[metric]);

	const waiting = $derived([
		{ title: 'Payments to confirm', icon: Payment01Icon, href: '/admin/payments', empty: 'No payments are waiting.', rows: data.payments.map((p) => ({ id: p.id, main: p.student, sub: p.course, end: money(p.amount), when: p.created_at })) },
		{ title: 'Questions to answer', icon: MessageQuestionIcon, href: '/admin/questions', empty: 'No questions are waiting.', rows: data.questions.map((q) => ({ id: q.id, main: short(q.body), sub: `${q.student} · ${q.lesson}`, end: '', when: q.created_at })) },
		{ title: 'Assignments to review', icon: Task01Icon, href: '/admin/submissions', empty: 'No assignments are waiting.', rows: data.submissions.map((s) => ({ id: s.id, main: s.student, sub: s.lesson, end: '', when: s.created_at })) }
	]);
</script>

<Seo title="Overview | Admin" description="What is happening in your academy." noindex />

<div class="app-page">
	<PageHeader title="Overview" description="How the academy is doing, and what is waiting for you.">
		{#snippet actions()}
			<Button variant="outline" href="/admin/analytics">Analytics</Button>
			<Button href="/admin/courses">Manage courses</Button>
		{/snippet}
	</PageHeader>

	<div class="stats">
		{#each stats as stat (stat.label)}<Stat label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} />{/each}
	</div>

	<Tabs.Root variant="pill" fit>
		<Tabs.List label="Overview sections">
			<Tabs.Tab value="trend">Trend</Tabs.Tab>
			{#each waiting as list (list.title)}<Tabs.Tab value={list.title}>{list.title}</Tabs.Tab>{/each}
			<Tabs.Tab value="recent">Latest enrollments</Tabs.Tab>
			<Tabs.Tab value="popular">Most popular courses</Tabs.Tab>
		</Tabs.List>
		<Tabs.Panel value="trend" class="tab-panel">
	<Card flush>
		<StatTabs label="What the chart shows" {items} bind:value={metric} />
		<div class="chart">
			{#if sum(chosen.values)}
				<TrendChart title="{chosen.label}, last 30 days" description="One point per day." {labels} values={chosen.values} />
			{:else}
				<p class="muted flat">Nothing to show for the last 30 days yet. The chart fills in as students join and learn.</p>
			{/if}
		</div>
	</Card>
		</Tabs.Panel>

		{#each waiting as list (list.title)}
		<Tabs.Panel value={list.title} class="tab-panel">
			<Card title={list.title} icon={list.icon} level={2} flush>
				{#snippet aside()}<Button size="sm" variant="outline" href={list.href}>View all</Button>{/snippet}
				{#if list.rows.length}
					<ul class="rows">
						{#each list.rows as row (row.id)}
							<li>
								<a href="{list.href}?open={row.id}">
									<span><strong>{row.main}</strong><span class="muted">{row.sub}</span></span>
									<span class="end">{#if row.end}<strong>{row.end}</strong>{/if}<span class="muted">{date(row.when)}</span></span>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted none">{list.empty}</p>
				{/if}
			</Card>
		</Tabs.Panel>
		{/each}

		<Tabs.Panel value="recent" class="tab-panel">
		<Card title="Latest enrollments" icon={UserGroupIcon} level={2} flush>
			{#snippet aside()}<Button size="sm" variant="outline" href="/admin/students">All students</Button>{/snippet}
			{#if data.recent.length}
				<ul class="rows">
					{#each data.recent as row (row.id)}
						<li>
							<a href="/admin/students?open={row.user_id}">
								<span><strong>{row.student}</strong><span class="muted">{row.course}</span></span>
								<span class="end"><span class="muted">{date(row.created_at)}</span></span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted none">Nobody has enrolled yet. New enrollments show up here.</p>
			{/if}
		</Card>
		</Tabs.Panel>

		<Tabs.Panel value="popular" class="tab-panel">
		<Card title="Most popular courses" icon={BookOpen01Icon} level={2}>
			{#snippet aside()}<Button size="sm" variant="outline" href="/admin/analytics">Details</Button>{/snippet}
			{#if data.courses.some((c) => c.students)}
				<ul class="courses">
					{#each data.courses.filter((c) => c.students) as course (course.id)}
						<li>
							<Progress
								label={course.title}
								value={course.completed}
								max={course.students}
								format={(done, all) => `${done} of ${plural(all, 'student')} finished`}
							/>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted">No course has students yet.</p>
			{/if}
		</Card>
		</Tabs.Panel>
	</Tabs.Root>
</div>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
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
	.rows,
	.courses {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.rows a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--ui-line);
		text-decoration: none;
		font-size: 0.875rem;
	}
	.rows a:hover {
		background: var(--ui-subtle);
	}
	.rows span {
		display: grid;
		min-width: 0;
	}
	.rows strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.end {
		flex: none;
		text-align: end;
	}
	.none {
		padding: 1rem 1.25rem;
		font-size: 0.875rem;
	}
	.courses {
		display: grid;
		gap: 1rem;
	}
</style>
