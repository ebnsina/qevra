<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ArrowLeft02Icon,
		ArrowRight02Icon,
		Calendar03Icon,
		Certificate01Icon,
		Comment01Icon,
		Download01Icon,
		File01Icon,
		PencilEdit01Icon,
		StarIcon,
		CheckmarkCircle02Icon,
		CircleIcon,
		Quiz01Icon,
		Task01Icon
	} from '@hugeicons/core-free-icons';
	import PageHeader from '#lib/sinaui/blocks/studio/PageHeader.svelte';
	import Alert from '#lib/sinaui/ui/Alert.svelte';
	import Badge from '#lib/sinaui/ui/Badge.svelte';
	import Button from '#lib/sinaui/ui/Button.svelte';
	import Card from '#lib/sinaui/ui/Card.svelte';
	import ConfirmButton from '#lib/sinaui/ui/ConfirmButton.svelte';
	import FileDrop from '#lib/sinaui/ui/FileDrop.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Input from '#lib/sinaui/ui/Input.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import * as Tabs from '#lib/sinaui/ui/tabs/index.ts';
	import * as Radio from '#lib/sinaui/ui/radio/index.ts';
	import CustomSelect from '#lib/sinaui/ui/CustomSelect.svelte';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { date, dateTime, plural } from '#lib/format.ts';
	import { message } from '#lib/messages.ts';
	import { PASS_MARK } from '#lib/quiz.ts';
	import { submitting } from '#lib/submitting.svelte.ts';

	let { data, form } = $props();
	const lesson = $derived(data.lesson);
	const done = $derived(data.lessons.filter((l) => l.done).length);
	const base = $derived(`/portal/courses/${data.course.slug}`);
	// Lessons grouped under their module, in order.
	const modules = $derived(Object.entries(Object.groupBy(data.lessons, (l) => l.module)));
	const quizPassed = $derived(Boolean(data.attempt?.passed));

	const complete = submitting();
	const ask = submitting();
	const note = submitting();
	const rate = submitting();
	let deleteForms = $state<Record<string, HTMLFormElement>>({});
	const quiz = submitting();
	const submit = submitting();
</script>

<Seo title="{lesson.title} | {data.course.title}" description={lesson.title} noindex />

{#snippet post(item: (typeof data.threads)[number]['replies'][number])}
	<div class="post">
		<div class="by">
			<strong>{item.author_name}</strong>
			{#if item.by_staff}<Badge tone="accent" icon={false}>Teacher</Badge>{/if}
			<span class="muted">{date(item.created_at)}</span>
			{#if item.user_id === data.user?.id}
				<form method="post" action="?/deletePost" bind:this={deleteForms[item.id]} use:enhance hidden>
					<input type="hidden" name="id" value={item.id} />
				</form>
				<ConfirmButton size="sm" onconfirm={() => deleteForms[item.id]?.requestSubmit()} confirm="Delete it?" done="Deleted">Delete</ConfirmButton>
			{/if}
		</div>
		<p class="body">{item.body}</p>
	</div>
{/snippet}

<div class="app-page">
	<PageHeader title={lesson.title} description={data.course.title}>
		{#snippet actions()}
			{#if lesson.done}<Badge tone="accent">Completed</Badge>{/if}
			<Button variant="outline" href={data.previous ? `${base}/${data.previous}` : undefined} disabled={!data.previous}>
				<Icon icon={ArrowLeft02Icon} /> Previous
			</Button>
			<Button variant="outline" href={data.next ? `${base}/${data.next}` : undefined} disabled={!data.next}>
				Next <Icon icon={ArrowRight02Icon} />
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.preview}
		<Alert title="You are previewing this course as a student sees it">
			You are not enrolled, so nothing you do here is recorded as progress.
			{#snippet actions()}<Button size="sm" variant="outline" href="/admin/courses">Back to admin</Button>{/snippet}
		</Alert>
	{/if}
	{#if data.certificate}
		<Alert tone="success" title="You finished this course">
			Your certificate is ready.
			{#snippet actions()}<Button size="sm" href="/certificates/{data.certificate}">View certificate</Button>{/snippet}
		</Alert>
	{/if}
	{#if form && 'code' in form}<Alert tone="danger" title={message(form.code)} live />{/if}

	<div class="layout">
		<div class="main">
			{#if lesson.video}
				<div class="video">
					<iframe src={lesson.video} title={lesson.title} allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
				</div>
			{/if}




			<!-- One thing per tab, so the lesson is not a long scroll. Each lesson starts on its first tab. -->
			{#key lesson.id}
			<Tabs.Root variant="pill" fit>
				<Tabs.List label="Lesson sections">
					{#if lesson.html}<Tabs.Tab value="lesson">Lesson</Tabs.Tab>{/if}
					{#if data.questions.length}<Tabs.Tab value="quiz">Quiz</Tabs.Tab>{/if}
					{#if lesson.assignment}<Tabs.Tab value="assignment">Assignment</Tabs.Tab>{/if}
					<Tabs.Tab value="questions">Questions</Tabs.Tab>
					<Tabs.Tab value="notes">My notes</Tabs.Tab>
					{#if data.files.length}<Tabs.Tab value="downloads">Downloads</Tabs.Tab>{/if}
					{#if data.live.length}<Tabs.Tab value="live">Live classes</Tabs.Tab>{/if}
					{#if !data.preview}<Tabs.Tab value="review">Rate this course</Tabs.Tab>{/if}
				</Tabs.List>
				{#if lesson.html}
				<Tabs.Panel value="lesson" class="tab-panel">
			<Card><div class="prose">{@html lesson.html}</div></Card>
				</Tabs.Panel>
				{/if}
				{#if data.questions.length}
				<Tabs.Panel value="quiz" class="tab-panel">
				<Card title="Quiz" icon={Quiz01Icon} level={2} description="Get {PASS_MARK * 100}% right to pass. You can try as many times as you need.">
					{#snippet aside()}
						{#if data.attempt}
							<Badge tone={data.attempt.passed ? 'accent' : 'warning'}>
								{data.attempt.passed ? 'Passed' : 'Not passed'} · {data.attempt.score}/{data.attempt.total}
							</Badge>
						{/if}
					{/snippet}
					<form method="post" action="?/quiz" class="app-form" use:enhance={quiz.enhance}>
						{#if form && 'quiz' in form && form.quiz}
							<Alert
								tone={form.quiz.passed ? 'success' : 'warning'}
								title={form.quiz.passed
									? `Passed: ${form.quiz.score} of ${form.quiz.total} right.`
									: `${form.quiz.score} of ${form.quiz.total} right. Watch the lesson again and have another go.`}
								live
							/>
						{/if}
						{#each data.questions as question, i (question.id)}
							<Radio.Group legend="{i + 1}. {question.question}" name="q_{question.id}" required>
								{#each question.options as option, o (o)}<Radio.Item value={String(o)}>{option}</Radio.Item>{/each}
							</Radio.Group>
						{/each}
						<div class="app-form-actions">
							<Button type="submit" loading={quiz.busy} variant={quizPassed ? 'outline' : 'primary'}>
								{quizPassed ? 'Try again' : 'Check answers'}
							</Button>
						</div>
					</form>
				</Card>
				</Tabs.Panel>
				{/if}
				{#if lesson.assignment}
				<Tabs.Panel value="assignment" class="tab-panel">
				<Card title="Assignment" icon={Task01Icon} level={2} description={lesson.assignment}>
					{#snippet aside()}
						{#if data.submission}
							<Badge tone={data.submission.reviewed_at ? 'accent' : 'neutral'}>{data.submission.reviewed_at ? 'Reviewed' : 'Submitted'}</Badge>
						{/if}
					{/snippet}
					{#if data.submission}
						<dl class="app-fields">
							<dt>Your file</dt>
							<dd><a href="/files/{data.submission.file_key}" download={data.submission.file_name}>{data.submission.file_name}</a></dd>
							{#if data.submission.note}
								<dt>Your note</dt>
								<dd>{data.submission.note}</dd>
							{/if}
							{#if data.submission.reviewed_at}
								<dt>Grade</dt>
								<dd><strong>{data.submission.grade || 'Reviewed'}</strong></dd>
								<dt>Feedback</dt>
								<dd>{data.submission.feedback || 'No written feedback.'}</dd>
							{/if}
						</dl>
					{/if}
					{#if !data.submission?.reviewed_at}
						<form method="post" action="?/submit" enctype="multipart/form-data" class="app-form upload" use:enhance={submit.enhance}>
							<FileDrop
								label={data.submission ? 'Replace your file' : 'Your work'}
								name="file"
								accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
								maxSize={4 * 1024 * 1024}
								hint="PDF, Word or a photo, up to 4 MB."
							/>
							<Textarea label="Note to the teacher (optional)" placeholder="Anything the teacher should know about this work" name="note" maxlength={1000} />
							<div class="app-form-actions">
								<Button type="submit" loading={submit.busy}>{data.submission ? 'Send again' : 'Hand in'}</Button>
							</div>
						</form>
					{/if}
				</Card>
				</Tabs.Panel>
				{/if}
				<Tabs.Panel value="questions" class="tab-panel">
			<Card title="Questions and answers" icon={Comment01Icon} level={2} description="Ask about this lesson. Your teacher and classmates can reply.">
				<form method="post" action="?/post" class="app-form" use:enhance={ask.enhance}>
					<Textarea label="Your question" placeholder="What part of this lesson is unclear?" name="body" rows={2} required maxlength={4000} />
					<div class="app-form-actions"><Button type="submit" variant="outline" loading={ask.busy}>Ask</Button></div>
				</form>
				{#if data.threads.length}
					<ul class="threads">
						{#each data.threads as thread (thread.id)}
							<li>
								{@render post(thread)}
								{#if thread.replies.length}
									<ul class="replies">
										{#each thread.replies as reply (reply.id)}<li>{@render post(reply)}</li>{/each}
									</ul>
								{/if}
								<form method="post" action="?/post" class="reply" use:enhance>
									<input type="hidden" name="parent_id" value={thread.id} />
									<Input label="Reply to {thread.author_name}" hideLabel name="body" placeholder="Write a reply" required maxlength={4000} />
									<Button type="submit" variant="ghost" size="sm">Reply</Button>
								</form>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted quiet">No questions yet. Be the first to ask.</p>
				{/if}
			</Card>
				</Tabs.Panel>
				<Tabs.Panel value="notes" class="tab-panel">
			<Card title="My notes" icon={PencilEdit01Icon} level={2} description="Only you can see these.">
				<form method="post" action="?/note" class="app-form" use:enhance={note.enhance}>
					<Textarea label="Notes on this lesson" placeholder="Write your own notes here. Only you can see them." hideLabel name="body" rows={4} maxlength={10000} value={data.note} />
					<div class="app-form-actions">
						<Button variant="ghost" size="sm" href="/portal/notes">All my notes</Button>
						<Button type="submit" variant="outline" size="sm" loading={note.busy}>Save notes</Button>
					</div>
				</form>
			</Card>
				</Tabs.Panel>
				{#if data.files.length}
				<Tabs.Panel value="downloads" class="tab-panel">
				<Card title="Downloads" icon={Download01Icon} level={2}>
					<ul class="files">
						{#each data.files as file (file.id)}
							<li><Icon icon={File01Icon} size={16} /><a href="/files/{file.file_key}" download={file.file_name}>{file.title}</a></li>
						{/each}
					</ul>
				</Card>
				</Tabs.Panel>
				{/if}
				{#if data.live.length}
				<Tabs.Panel value="live" class="tab-panel">
				<Card title="Live classes" icon={Calendar03Icon} level={2}>
					<ul class="live">
						{#each data.live as session (session.id)}
							<li>
								<div>
									<strong>{session.title}</strong>
									<span class="muted num">{dateTime(session.starts_at)}</span>
								</div>
								{#if session.past}
									{#if session.recording_url}
										<Button size="sm" variant="outline" href={session.recording_url} target="_blank" rel="noopener">Recording</Button>
									{:else}
										<Badge icon={false}>Ended</Badge>
									{/if}
								{:else}
									<Button size="sm" href={session.meeting_url} target="_blank" rel="noopener">Join</Button>
								{/if}
							</li>
						{/each}
					</ul>
				</Card>
				</Tabs.Panel>
				{/if}
				{#if !data.preview}
				<Tabs.Panel value="review" class="tab-panel">
				<Card title="Rate this course" icon={StarIcon} level={2}>
					{#snippet aside()}
						{#if data.review}<Badge tone={data.review.approved ? 'accent' : 'neutral'}>{data.review.approved ? 'Published' : 'Waiting for approval'}</Badge>{/if}
					{/snippet}
					<form method="post" action="?/review" class="app-form" use:enhance={rate.enhance}>
						<CustomSelect label="Your rating" name="rating" required value={String(data.review?.rating ?? 5)} options={[5, 4, 3, 2, 1].map((stars) => ({ value: String(stars), label: `${'★'.repeat(stars)} ${stars} of 5` }))} />
						<Textarea label="What did you think? (optional)" placeholder="What helped, and what could be better?" name="body" rows={3} maxlength={2000} value={data.review?.body ?? ''} />
						<div class="app-form-actions">
							<Button type="submit" variant="outline" size="sm" loading={rate.busy}>{data.review ? 'Update review' : 'Send review'}</Button>
						</div>
					</form>
				</Card>
				</Tabs.Panel>
				{/if}
			</Tabs.Root>
			{/key}

			{#if !lesson.done && !data.questions.length && !lesson.assignment}
				<form method="post" action="?/complete" class="app-form-actions" use:enhance={complete.enhance}>
					<Button type="submit" loading={complete.busy}><Icon icon={CheckmarkCircle02Icon} /> Mark as complete</Button>
				</form>
			{/if}
		</div>

		<aside class="side">
			<Card title="Lessons" level={2}>
				<Progress label="{done} of {plural(data.lessons.length, 'lesson')} done" value={done} max={data.lessons.length} />
				{#each modules as [module, lessons] (module)}
					<p class="module">{module}</p>
					<ol class="lessons">
						{#each lessons ?? [] as item (item.id)}
							<li>
								<a href="{base}/{item.id}" aria-current={item.id === lesson.id ? 'page' : undefined}>
									<Icon icon={item.done ? CheckmarkCircle02Icon : CircleIcon} size={16} label={item.done ? 'Done' : 'Not done'} />
									<span>{item.title}</span>
								</a>
							</li>
						{/each}
					</ol>
				{/each}
			</Card>





		</aside>
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 20rem;
		gap: var(--app-gap);
		align-items: start;
	}
	.main,
	.side {
		display: grid;
		gap: var(--app-gap);
		min-width: 0;
	}
	@media (max-width: 60rem) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.video {
		aspect-ratio: 16 / 9;
		border-radius: var(--ui-radius);
		overflow: hidden;
		background: #0f0f10;
	}
	.video iframe {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}
	.upload {
		margin-top: 1rem;
	}
	.module {
		margin-top: 1rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--ui-muted);
	}
	.lessons {
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.1rem;
	}
	.lessons a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.6rem;
		margin-inline: -0.6rem;
		border-radius: var(--ui-radius-control);
		text-decoration: none;
		font-size: 0.9375rem;
	}
	.lessons a:hover {
		background: var(--ui-subtle);
	}
	.lessons a[aria-current] {
		background: var(--app-tint-strong);
		font-weight: 600;
	}
	.lessons a :global(svg) {
		flex: none;
		color: var(--ui-accent);
	}
	.live {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.9rem;
	}
	.live li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.live div {
		display: grid;
		font-size: 0.9375rem;
	}
	.live .num {
		font-size: 0.8125rem;
	}
	.threads,
	.replies,
	.files {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.threads {
		margin-top: 1.25rem;
	}
	.threads > li {
		display: grid;
		gap: 0.75rem;
		padding-block: 1rem;
		border-top: 1px solid var(--ui-line);
	}
	.replies {
		display: grid;
		gap: 0.75rem;
		padding-inline-start: 1rem;
		border-inline-start: 2px solid var(--ui-line);
	}
	.by {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	.body {
		margin-top: 0.25rem;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.reply {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}
	.quiet {
		margin-top: 1rem;
		font-size: 0.875rem;
	}
	.files {
		display: grid;
		gap: 0.6rem;
	}
	.files li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.files :global(svg) {
		flex: none;
		color: var(--ui-accent);
	}
</style>
