<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { BookOpen01Icon, Calendar03Icon, StarIcon, UserIcon } from '@hugeicons/core-free-icons';
	import DetailSheet from '#lib/sinaui/blocks/studio/DetailSheet.svelte';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import ConfirmButton from '#lib/sinaui/ui/ConfirmButton.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Select from '#lib/sinaui/ui/Select.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime } from '#lib/format.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data } = $props();
	let openId = $state<string>();
	const selected = $derived(data.reviews.find((r) => r.id === openId));
	const act = submitting(() => (openId = undefined));
	let deleteForm = $state<HTMLFormElement>();
	const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
</script>

<Seo title="Course reviews | Admin" description="Students' ratings of courses." noindex />

<div class="app-page">
	<PageHeader title="Course reviews" description="Students' ratings. A review shows on its course page, and counts toward the stars, once you approve it.">
		{#snippet actions()}
			<Select label="Show" hideLabel value={data.show} onchange={(e) => goto(`?show=${e.currentTarget.value}`)}>
				<option value="waiting">Waiting for approval</option>
				<option value="all">All reviews</option>
			</Select>
		{/snippet}
	</PageHeader>

	<Card flush>
		{#if data.reviews.length}
			<Table caption="Course reviews" hideCaption>
				<thead><tr><th>Student</th><th>Course</th><th>Rating</th><th>Sent</th><th>Status</th></tr></thead>
				<tbody>
					{#each data.reviews as review (review.id)}
						<tr onclick={() => (openId = review.id)}>
							<td><RowLink label={review.author_name} onclick={() => (openId = review.id)} /></td>
							<td>{review.course}</td>
							<td aria-label="{review.rating} out of 5">{stars(review.rating)}</td>
							<td>{dateTime(review.created_at)}</td>
							<td><Badge tone={review.approved ? 'accent' : 'warning'}>{review.approved ? 'Published' : 'Waiting'}</Badge></td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title={data.show === 'waiting' ? 'No reviews are waiting' : 'No reviews yet'} icon={StarIcon}>
				Students can rate a course from any of its lessons. Their reviews come here first.
			</EmptyState>
		{/if}
	</Card>
</div>

<DetailSheet
	bind:open={() => Boolean(selected), (open) => !open && (openId = undefined)}
	title="Review by {selected?.author_name ?? ''}"
	fields={selected
		? [
				{ label: 'Student', value: selected.author_name, icon: UserIcon },
				{ label: 'Course', value: selected.course, icon: BookOpen01Icon },
				{ label: 'Rating', value: `${stars(selected.rating)} (${selected.rating} of 5)`, icon: StarIcon },
				{ label: 'Sent', value: dateTime(selected.created_at), icon: Calendar03Icon }
			]
		: []}
>
	{#snippet lead()}
		{#if selected}<Badge tone={selected.approved ? 'accent' : 'warning'}>{selected.approved ? 'Published' : 'Waiting for approval'}</Badge>{/if}
	{/snippet}
	{#if selected}
		<p class="body">{selected.body || 'No written review, only the rating.'}</p>
		<form id="review" method="post" action={selected.approved ? '?/hide' : '?/approve'} use:enhance={act.enhance} hidden>
			<input type="hidden" name="id" value={selected.id} />
		</form>
		<form method="post" action="?/delete" bind:this={deleteForm} use:enhance={act.enhance} hidden>
			<input type="hidden" name="id" value={selected.id} />
		</form>
	{/if}
	{#snippet footer()}
		<div class="foot">
			<ConfirmButton onconfirm={() => deleteForm?.requestSubmit()} confirm="Delete for good?" done="Deleted">Delete</ConfirmButton>
			<Button type="submit" form="review" variant={selected?.approved ? 'outline' : 'primary'} loading={act.busy}>
				{selected?.approved ? 'Hide from the website' : 'Approve and publish'}
			</Button>
		</div>
	{/snippet}
</DetailSheet>

<style>
	.body {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
	}
</style>
