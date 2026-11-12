<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ArrowLeft02Icon,
		ArrowRight02Icon,
		Calendar03Icon,
		Certificate01Icon,
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
	import FileDrop from '#lib/sinaui/ui/FileDrop.svelte';
	import Icon from '#lib/sinaui/ui/Icon.svelte';
	import Progress from '#lib/sinaui/ui/Progress.svelte';
	import * as Radio from '#lib/sinaui/ui/radio/index.ts';
	import Textarea from '#lib/sinaui/ui/Textarea.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dateTime, plural } from '#lib/format.ts';
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
	const quiz = submitting();
	const submit = submitting();
</script>

<Seo title="{lesson.title} | {data.course.title}" description={lesson.title} noindex />

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
			{#if lesson.html}<Card><div class="prose">{@html lesson.html}</div></Card>{/if}

			{#if data.questions.length}
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
			{/if}

			{#if lesson.assignment}
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
							<Textarea label="Note to the teacher (optional)" name="note" maxlength={1000} />
							<div class="app-form-actions">
								<Button type="submit" loading={submit.busy}>{data.submission ? 'Send again' : 'Hand in'}</Button>
							</div>
						</form>
					{/if}
				</Card>
			{/if}

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

			{#if data.live.length}
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
			{/if}

			{#if data.certificate}
				<Card title="Certificate" icon={Certificate01Icon} level={2}>
					<Button variant="outline" href="/certificates/{data.certificate}">View certificate</Button>
				</Card>
			{/if}
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
</style>
