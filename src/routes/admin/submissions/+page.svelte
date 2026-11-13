<script lang="ts">
	import { page } from '$app/state';
	import { adminPage, mutating, withRow } from '#lib/admin-query.svelte.ts';
	import { goto } from '$app/navigation';
	import { BookOpen01Icon, Calendar03Icon, File01Icon, Mail01Icon, Task01Icon, UserIcon } from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import RowLink from '#lib/sinaui/blocks/studio/RowLink.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import Dialog from '#lib/sinaui/ui/Dialog.svelte';
	import EmptyState from '#lib/sinaui/ui/EmptyState.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
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
	const selected = $derived(data.submissions.find((s) => s.id === openId));
	// Shown at once: a marked assignment leaves the waiting list, or shows its grade in the full list.
	const review = mutating<typeof loaded>(
		() => (openId = undefined),
		(old, sent) =>
			withRow(old, sent.get('id'), old.show === 'waiting' ? null : { grade: String(sent.get('grade') ?? ''), feedback: String(sent.get('feedback') ?? ''), reviewed_at: new Date() })
	);
</script>

<Seo title="Submissions | Admin" description="Review students' assignments." noindex />

<div class="app-page">
	<PageHeader title="Submissions">
		{#snippet actions()}<CustomSelect label="Show" hideLabel value={data.show} onchange={(value) => goto(`?show=${value}`)} options={[{ value: 'waiting', label: 'Waiting for review' }, { value: 'all', label: 'All submissions' }]} />{/snippet}
	</PageHeader>

	<Card flush>
		{#if data.submissions.length}
			<Table caption="Submissions" hideCaption>
				<thead><tr><th>Student</th><th>Course</th><th>Lesson</th><th>Handed in</th><th>Status</th></tr></thead>
				<tbody>
					{#each data.submissions as submission (submission.id)}
						<tr onclick={() => (openId = submission.id)}>
							<td><RowLink label={submission.student} onclick={() => (openId = submission.id)} /></td>
							<td>{submission.course}</td>
							<td>{submission.lesson}</td>
							<td>{dateTime(submission.created_at)}</td>
							<td>
								<Badge tone={submission.reviewed_at ? 'accent' : 'warning'}>{submission.reviewed_at ? submission.grade || 'Reviewed' : 'To review'}</Badge>
							</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{:else}
			<EmptyState title={data.show === 'waiting' ? 'Nothing to review' : 'No submissions yet'} icon={Task01Icon}>
				When a student hands in an assignment, it appears here for your grade and feedback.
			</EmptyState>
		{/if}
	</Card>
</div>

<Dialog side="end" title="{selected?.student ?? ''}: {selected?.lesson ?? ''}" bind:open={() => Boolean(selected), (open) => !open && (openId = undefined)}>
	{#if selected}
		{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}
		<dl class="app-fields">
			<dt><Icon icon={UserIcon} size={16} /> Student</dt>
			<dd>{selected.student}</dd>
			<dt><Icon icon={Mail01Icon} size={16} /> Email</dt>
			<dd>{selected.email}</dd>
			<dt><Icon icon={BookOpen01Icon} size={16} /> Course</dt>
			<dd>{selected.course}</dd>
			<dt><Icon icon={Task01Icon} size={16} /> Task</dt>
			<dd>{selected.assignment}</dd>
			<dt><Icon icon={File01Icon} size={16} /> Their file</dt>
			<dd><a href="/files/{selected.file_key}" download={selected.file_name}>{selected.file_name}</a></dd>
			{#if selected.note}
				<dt>Their note</dt>
				<dd>{selected.note}</dd>
			{/if}
			<dt><Icon icon={Calendar03Icon} size={16} /> Handed in</dt>
			<dd>{dateTime(selected.created_at)}</dd>
		</dl>
		<form id="grade" method="post" action="?/review" class="app-form grade" onsubmit={review.submit}>
			<input type="hidden" name="id" value={selected.id} />
			<Input label="Grade" placeholder="8/10" name="grade" value={selected.grade} maxlength={40} hint="A mark or a word: 8/10, Good, Needs work." />
			<Textarea label="Feedback" placeholder="Good use of articles. Check the tense in sentence three." name="feedback" rows={5} value={selected.feedback} maxlength={2000} hint="The student sees this under their assignment." />
		</form>
	{/if}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (openId = undefined)}>Cancel</Button>
		<Button type="submit" form="grade" loading={review.busy}>{selected?.reviewed_at ? 'Update review' : 'Save review'}</Button>
	{/snippet}
</Dialog>

<style>
	.grade {
		margin-top: 1.5rem;
	}
</style>
