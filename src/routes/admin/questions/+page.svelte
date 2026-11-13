<script lang="ts">
	import { page } from '$app/state';
	import { adminPage, mutating, withRow } from '#lib/admin-query.svelte.ts';
	import { goto } from '$app/navigation';
	import { MessageQuestionIcon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import ConfirmButton from '#lib/sinaui/ui/ConfirmButton.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import CustomSelect from '#lib/sinaui/ui/CustomSelect.svelte';
	import Table from '#lib/sinaui/ui/Table.svelte';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime } from '#lib/format.ts';
	import { message } from '#lib/messages.ts';

	let { data: loaded } = $props();
	const admin = adminPage(() => loaded);
	const data = $derived(admin.data);
	const form = $derived(admin.form);
	// A link from the Overview names the one to open (?open=<id>), so nobody has to find it in the list again.
	let openId = $state(page.url.searchParams.get('open') ?? undefined);
	const selected = $derived(data.questions.find((q) => q.id === openId));
	// Shown at once: an answered question leaves the waiting list; a deleted one leaves every list.
	const answer = mutating<typeof loaded>(
		() => (openId = undefined),
		(old, sent, action) => withRow(old, sent.get('id'), action === '?/delete' || old.show === 'open' ? null : { answered: true })
	);
	let deleteForm = $state<HTMLFormElement>();
	const short = (text: string) => (text.length > 70 ? `${text.slice(0, 70)}…` : text);
</script>

<Seo title="Questions | Admin" description="Questions students ask under lessons." noindex />

<div class="app-page">
	<PageHeader title="Questions" description="What students ask under lessons. An answer from you is marked as the teacher's.">
		{#snippet actions()}
			<CustomSelect label="Show" hideLabel value={data.show} onchange={(value) => goto(`?show=${value}`)} options={[{ value: 'open', label: 'Waiting for an answer' }, { value: 'all', label: 'All questions' }]} />
		{/snippet}
	</PageHeader>

	<Card flush>
		{#if data.questions.length}
			<Table caption="Questions" hideCaption>
				<thead><tr><th>Question</th><th>Student</th><th>Lesson</th><th>Asked</th><th>Status</th></tr></thead>
				<tbody>
					{#each data.questions as question (question.id)}
						<tr onclick={() => (openId = question.id)}>
							<td><RowLink label={short(question.body)} onclick={() => (openId = question.id)} /></td>
							<td>{question.author_name}</td>
							<td>{question.lesson}</td>
							<td>{dateTime(question.created_at)}</td>
							<td><Badge tone={question.answered ? 'accent' : 'warning'}>{question.answered ? 'Answered' : 'Waiting'}</Badge></td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title={data.show === 'open' ? 'No questions are waiting' : 'No questions yet'} icon={MessageQuestionIcon}>
				When a student asks something under a lesson, it appears here for you to answer.
			</EmptyState>
		{/if}
	</Card>
</div>

<Dialog side="end" title="Question from {selected?.author_name ?? ''}" description="{selected?.course ?? ''} · {selected?.lesson ?? ''}" bind:open={() => Boolean(selected), (open) => !open && (openId = undefined)}>
	{#if selected}
		{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}
		<p class="body">{selected.body}</p>
		{#if selected.replies.length}
			<ul class="replies">
				{#each selected.replies as reply (reply.id)}
					<li>
						<p class="by"><strong>{reply.author_name}</strong>{#if reply.by_staff}<Badge tone="accent" icon={false}>Teacher</Badge>{/if}<span class="muted">{dateTime(reply.created_at)}</span></p>
						<p class="body">{reply.body}</p>
					</li>
				{/each}
			</ul>
		{/if}
		<form id="answer" method="post" action="?/answer" class="app-form answer" onsubmit={answer.submit}>
			<input type="hidden" name="id" value={selected.id} />
			<Textarea label="Your answer" placeholder="Write a clear answer the whole class can learn from" name="body" rows={5} required maxlength={4000} />
		</form>
		<form method="post" action="?/delete" bind:this={deleteForm} onsubmit={answer.submit} hidden>
			<input type="hidden" name="id" value={selected.id} />
		</form>
	{/if}
	{#snippet footer()}
		<div class="foot">
			<ConfirmButton onconfirm={() => deleteForm?.requestSubmit()} confirm="Delete the question?" done="Deleted">Delete</ConfirmButton>
			{#if selected}<Button variant="outline" href="/portal/courses/{selected.slug}/{selected.lesson_id}">Open the lesson</Button>{/if}
			<Button type="submit" form="answer" loading={answer.busy}>Post answer</Button>
		</div>
	{/snippet}
</Dialog>

<style>
	.body {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.replies {
		list-style: none;
		margin: 1.25rem 0 0;
		padding: 0 0 0 1rem;
		display: grid;
		gap: 1rem;
		border-inline-start: 2px solid var(--ui-line);
	}
	.by {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	.answer {
		margin-top: 1.5rem;
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}
	.foot :global(:last-child) {
		margin-inline-start: auto;
	}
</style>
