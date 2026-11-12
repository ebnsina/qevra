<script lang="ts">
	import { BookOpen01Icon, Calendar03Icon, News01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date, dateTime, plural } from '#lib/format.ts';

	let { data } = $props();
</script>

<Seo title="My courses | {data.settings.name}" description="Your courses and progress." noindex />

<div class="app-page">
	<PageHeader title="My courses">
		{#snippet actions()}<Button variant="outline" href="/courses">Browse courses</Button>{/snippet}
	</PageHeader>

	{#if data.pending}
		<Alert title="{plural(data.pending, 'payment')} waiting for confirmation">
			Your course opens as soon as we confirm it, usually within a day.
			{#snippet actions()}<Button size="sm" variant="outline" href="/portal/payments">View payments</Button>{/snippet}
		</Alert>
	{/if}

	{#if data.courses.length}
		<div class="app-cards">
			{#each data.courses as course (course.slug)}
				<Card title={course.title} description={course.summary} level={2}>
					{#snippet aside()}{#if course.completed_at}<Badge tone="accent">Completed</Badge>{/if}{/snippet}
					<Progress
						label="{course.done} of {plural(course.total, 'lesson')} done"
						value={course.done}
						max={Math.max(course.total, 1)}
					/>
					{#snippet footer()}
						<Button href="/portal/courses/{course.slug}">{course.done === 0 ? 'Start' : course.completed_at ? 'Review' : 'Continue'}</Button>
					{/snippet}
				</Card>
			{/each}
		</div>
	{:else}
		<Card>
			<EmptyState title="You have no courses yet" icon={BookOpen01Icon}>
				Pick a course and enroll. It shows up here once your payment is confirmed.
				{#snippet actions()}<Button href="/courses">Browse courses</Button>{/snippet}
			</EmptyState>
		</Card>
	{/if}

	{#if data.announcements.length}
		<Card title="Announcements" icon={News01Icon} level={2} flush>
			<ul class="live">
				{#each data.announcements as item (item.id)}
					<li class="news">
						<div>
							<strong>{item.title}</strong>
							<span class="muted">{item.course} · {date(item.created_at)}</span>
							{#if item.body}<p class="news-body">{item.body}</p>{/if}
						</div>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}

	{#if data.live.length}
		<Card title="Upcoming live classes" icon={Calendar03Icon} level={2} flush>
			<ul class="live">
				{#each data.live as session (session.id)}
					<li>
						<div>
							<strong>{session.title}</strong>
							<span class="muted">{session.course} · <span class="num">{dateTime(session.starts_at)}</span></span>
						</div>
						<Button size="sm" variant="outline" href={session.meeting_url} target="_blank" rel="noopener">Join</Button>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}
</div>

<style>
	.live {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.live li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 1.25rem;
		border-top: 1px solid var(--ui-line);
	}
	.live div {
		display: grid;
		font-size: 0.9375rem;
	}
	.news-body {
		margin-top: 0.4rem;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
</style>
