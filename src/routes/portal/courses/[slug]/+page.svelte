<script lang="ts">
	import { BookOpen01Icon, Calendar03Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime } from '#lib/format.ts';

	let { data } = $props();
</script>

<Seo title="{data.course.title} | {data.settings.name}" description={data.course.summary} noindex />

<div class="app-page">
	<PageHeader title={data.course.title} description={data.course.summary} />

	<Card>
		<EmptyState title="Lessons are being added" icon={BookOpen01Icon}>
			You are enrolled. The first lessons will appear here as soon as your teacher publishes them.
			{#snippet actions()}<Button variant="outline" href="/portal">Back to my courses</Button>{/snippet}
		</EmptyState>
	</Card>

	{#if data.live.length}
		<Card title="Upcoming live classes" icon={Calendar03Icon} level={2} flush>
			<ul>
				{#each data.live as session (session.id)}
					<li>
						<div>
							<strong>{session.title}</strong>
							<span class="muted">{dateTime(session.starts_at)}</span>
						</div>
						<Button size="sm" href={session.meeting_url} target="_blank" rel="noopener">Join</Button>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}
</div>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 1.25rem;
		border-top: 1px solid var(--ui-line);
	}
	li div {
		display: grid;
	}
</style>
