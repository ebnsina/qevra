<script lang="ts">
	import { PencilEdit01Icon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date } from '#lib/format.ts';

	let { data } = $props();
	// Notes grouped under their course, in lesson order.
	const courses = $derived(Object.entries(Object.groupBy(data.notes, (n) => n.course)));
</script>

<Seo title="My notes | {data.settings.name}" description="Your notes on lessons." noindex />

<div class="app-page">
	<PageHeader title="My notes" description="Everything you wrote down while learning. Only you can see these." />

	{#each courses as [course, notes] (course)}
		<Card title={course} level={2} flush>
			<ul>
				{#each notes ?? [] as note (note.lesson_id)}
					<li>
						<div class="top">
							<a href="/portal/courses/{note.slug}/{note.lesson_id}"><strong>{note.lesson}</strong></a>
							<span class="muted">{date(note.updated_at)}</span>
						</div>
						<p class="body">{note.body}</p>
					</li>
				{/each}
			</ul>
		</Card>
	{:else}
		<Card>
			<EmptyState title="No notes yet" icon={PencilEdit01Icon}>
				Open a lesson and write in "My notes" beside the video. Your notes are collected here.
				{#snippet actions()}<Button href="/portal">Go to my courses</Button>{/snippet}
			</EmptyState>
		</Card>
	{/each}
</div>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: grid;
		gap: 0.4rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--ui-line);
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.top .muted {
		font-size: 0.8125rem;
	}
	.body {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
</style>
