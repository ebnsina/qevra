<script lang="ts">
	import {
		ArrowRight02Icon,
		BookOpen01Icon,
		Calendar03Icon,
		Certificate01Icon,
		CheckmarkCircle02Icon,
		MessageQuestionIcon,
		News01Icon,
		Quiz01Icon
	} from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Stat from '#lib/sinaui/blocks/studio/Stat.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import * as Tabs from '#lib/sinaui/ui/tabs/index.ts';
	import Seo from '#lib/components/Seo.svelte';
	import TrendChart from '#lib/components/TrendChart.svelte';
	import { date, dateTime, dayShort, number, plural } from '#lib/format.ts';

	let { data } = $props();
	const firstName = $derived(data.user?.name.split(' ')[0] ?? '');
	const inProgress = $derived(data.courses.filter((c) => !c.completed_at).length);
	const stats = $derived([
		{ label: 'Courses in progress', value: number(inProgress), icon: BookOpen01Icon, hint: `${plural(data.courses.length, 'course')} in all` },
		{ label: 'Lessons finished', value: number(data.totals.lessons), icon: CheckmarkCircle02Icon },
		{ label: 'Quizzes passed', value: number(data.totals.quizzes), icon: Quiz01Icon },
		{ label: 'Certificates', value: number(data.totals.certificates), icon: Certificate01Icon }
	]);
	const twoWeeks = $derived(data.days.reduce((total, d) => total + d.lessons, 0));
	const short = (text: string) => (text.length > 90 ? `${text.slice(0, 90)}…` : text);
</script>

<Seo title="Overview | {data.settings.name}" description="Your courses and progress." noindex />

<div class="app-page">
	<PageHeader title="Overview" description={firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}>
		{#snippet actions()}<Button variant="outline" href="/courses">Browse courses</Button>{/snippet}
	</PageHeader>

	{#if data.pending}
		<Alert title="{plural(data.pending, 'payment')} waiting for confirmation">
			Your course opens as soon as we confirm it, usually within a day.
			{#snippet actions()}<Button size="sm" variant="outline" href="/portal/payments">View payments</Button>{/snippet}
		</Alert>
	{/if}

	{#if data.courses.length}
		{#if data.current}
			<!-- The one thing to do next, before anything else on the page. -->
			<section class="continue">
				<div>
					<p class="kicker">{data.current.done ? 'Continue learning' : 'Start learning'}</p>
					<h2>{data.current.title}</h2>
					{#if data.current.next_lesson}<p class="next">Next: {data.current.next_lesson}</p>{/if}
				</div>
				<div class="continue-end">
					<Progress
						label="{data.current.done} of {plural(data.current.total, 'lesson')} done"
						value={data.current.done}
						max={data.current.total}
					/>
					<Button variant="secondary" href="/portal/courses/{data.current.slug}">
						{data.current.done ? 'Continue' : 'Start'} <Icon icon={ArrowRight02Icon} />
					</Button>
				</div>
			</section>
		{/if}

		<div class="stats">
			{#each stats as stat (stat.label)}<Stat label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} />{/each}
		</div>

		<Tabs.Root variant="pill" fit>
			<Tabs.List label="Overview sections">
				<Tabs.Tab value="activity">Your last 14 days</Tabs.Tab>
				<Tabs.Tab value="live">Live classes</Tabs.Tab>
				<Tabs.Tab value="courses">My courses</Tabs.Tab>
				<Tabs.Tab value="news">Announcements</Tabs.Tab>
				<Tabs.Tab value="answers">Answers</Tabs.Tab>
				<Tabs.Tab value="finished">Recently finished</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="activity" class="tab-panel">
			<Card title="Your last 14 days" level={2} description="{plural(twoWeeks, 'lesson')} finished. A little every day adds up.">
				{#if twoWeeks}
					<TrendChart
						title="Lessons you finished each day, last 14 days"
						labels={data.days.map((d) => dayShort(d.day))}
						values={data.days.map((d) => d.lessons)}
						aspectRatio={2.6}
					/>
				{:else}
					<p class="muted">Finish a lesson and your progress starts drawing here.</p>
				{/if}
			</Card>
			</Tabs.Panel>

			<Tabs.Panel value="live" class="tab-panel">
			<Card title="Upcoming live classes" icon={Calendar03Icon} level={2} flush>
				{#if data.live.length}
					<ul class="rows">
						{#each data.live as session (session.id)}
							<li class="row">
								<div>
									<strong>{session.title}</strong>
									<span class="muted">{session.course} · {dateTime(session.starts_at)}</span>
								</div>
								<Button size="sm" variant="outline" href={session.meeting_url} target="_blank" rel="noopener">Join</Button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted none">No live classes are planned for your courses right now.</p>
				{/if}
			</Card>
			</Tabs.Panel>

			<Tabs.Panel value="courses" class="tab-panel">
		<section class="block">
			<h2 class="block-title">My courses</h2>
			<div class="app-cards">
				{#each data.courses as course (course.slug)}
					<Card title={course.title} description={course.summary} level={3}>
						{#snippet aside()}{#if course.completed_at}<Badge tone="accent">Completed</Badge>{/if}{/snippet}
						<Progress label="{course.done} of {plural(course.total, 'lesson')} done" value={course.done} max={Math.max(course.total, 1)} />
						{#snippet footer()}
							<Button variant={course.completed_at ? 'outline' : 'primary'} href="/portal/courses/{course.slug}">
								{course.done === 0 ? 'Start' : course.completed_at ? 'Review' : 'Continue'}
							</Button>
						{/snippet}
					</Card>
				{/each}
			</div>
		</section>
			</Tabs.Panel>

			<Tabs.Panel value="news" class="tab-panel">
			<Card title="Announcements" icon={News01Icon} level={2} flush>
				{#if data.announcements.length}
					<ul class="rows">
						{#each data.announcements as item (item.id)}
							<li class="row top">
								<div>
									<strong>{item.title}</strong>
									<span class="muted">{item.course} · {date(item.created_at)}</span>
									{#if item.body}<p class="text">{item.body}</p>{/if}
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted none">Nothing new from your teacher.</p>
				{/if}
			</Card>
			</Tabs.Panel>

			<Tabs.Panel value="answers" class="tab-panel">
			<Card title="Answers to your questions" icon={MessageQuestionIcon} level={2} flush>
				{#if data.answers.length}
					<ul class="rows">
						{#each data.answers as answer (answer.id)}
							<li>
								<a class="row top" href="/portal/courses/{answer.slug}/{answer.lesson_id}">
									<div>
										<strong>{answer.lesson}</strong>
										<span class="muted">{date(answer.created_at)}</span>
										<p class="text">{short(answer.body)}</p>
									</div>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted none">Ask a question under any lesson. Your teacher's answers appear here.</p>
				{/if}
			</Card>
			</Tabs.Panel>

			<Tabs.Panel value="finished" class="tab-panel">
			<Card title="Recently finished" icon={CheckmarkCircle02Icon} level={2} flush>
				{#if data.finished.length}
					<ul class="rows">
						{#each data.finished as item (item.lesson_id)}
							<li>
								<a class="row" href="/portal/courses/{item.slug}/{item.lesson_id}">
									<div>
										<strong>{item.lesson}</strong>
										<span class="muted">{item.course} · {date(item.completed_at)}</span>
									</div>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted none">Lessons you finish are listed here.</p>
				{/if}
			</Card>
			</Tabs.Panel>
		</Tabs.Root>
	{:else}
		<Card>
			<EmptyState title="You have no courses yet" icon={BookOpen01Icon}>
				Pick a course and enroll. It shows up here once your payment is confirmed.
				{#snippet actions()}<Button href="/courses">Browse courses</Button>{/snippet}
			</EmptyState>
		</Card>
	{/if}
</div>

<style>
	.continue {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
		align-items: center;
		gap: 1.5rem 3rem;
		padding: clamp(1.25rem, 3vw, 2rem);
		border-radius: calc(var(--ui-radius) + 0.25rem);
		background: var(--ui-accent);
		color: var(--ui-on-accent);
	}
	.kicker {
		font-size: 0.8125rem;
		font-weight: 600;
		opacity: 0.85;
	}
	.continue h2 {
		font-size: 1.625rem;
		line-height: 1.2;
		margin-block: 0.25rem;
	}
	.next {
		opacity: 0.9;
	}
	.continue-end {
		display: grid;
		gap: 1rem;
		justify-items: start;
		/* The progress bar is drawn in the text color on the brand panel. */
		--ui-accent: var(--on-brand);
		--ui-muted: var(--on-brand);
		--ui-subtle: color-mix(in oklab, var(--on-brand) 25%, transparent);
	}
	.continue-end :global(> :first-child) {
		width: 100%;
	}
	@media (max-width: 48rem) {
		.continue {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
		gap: var(--app-gap);
	}
	.block {
		display: grid;
		gap: 0.75rem;
	}
	.block-title {
		font-size: 1.125rem;
	}
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8rem 1.25rem;
		border-top: 1px solid var(--ui-line);
		font-size: 0.875rem;
		text-decoration: none;
	}
	.row.top {
		align-items: flex-start;
	}
	a.row:hover {
		background: var(--ui-subtle);
	}
	.row div {
		display: grid;
		min-width: 0;
	}
	.text {
		margin-top: 0.35rem;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.none {
		padding: 1rem 1.25rem;
		font-size: 0.875rem;
	}
</style>
